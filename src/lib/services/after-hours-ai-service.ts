/**
 * 영업시간 외 AI 자동 응대 서비스 (Claude Haiku).
 *
 * SiteSetting `contact.hours` (예: "평일 09:00 - 18:00") 를 파싱하여
 * 현재 시각이 영업시간 외인지 판단하고 정중한 자동 응답을 생성합니다.
 *
 * ANTHROPIC_API_KEY 미설정 시 정적 fallback 메시지를 반환합니다.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const KST_OFFSET_MIN = 9 * 60;

// ── Business hours parsing ─────────────────────────────────────
export type BusinessHours = {
  raw: string;
  weekdaysOnly: boolean;
  startHour: number;
  endHour: number;
};

const DEFAULT_HOURS: BusinessHours = {
  raw: "평일 09:00 - 18:00",
  weekdaysOnly: true,
  startHour: 9,
  endHour: 18,
};

export function parseBusinessHours(raw: string | null | undefined): BusinessHours {
  if (!raw) return DEFAULT_HOURS;
  const weekdaysOnly = /평일|weekday|월[~-]금/i.test(raw);
  const match = raw.match(/(\d{1,2})\s*[:시]\s*(\d{0,2})?\s*[-~–—]\s*(\d{1,2})\s*[:시]\s*(\d{0,2})?/);
  if (!match) return { ...DEFAULT_HOURS, raw };
  const startHour = Number(match[1]);
  const endHour = Number(match[3]);
  if (!Number.isFinite(startHour) || !Number.isFinite(endHour)) {
    return { ...DEFAULT_HOURS, raw };
  }
  return { raw, weekdaysOnly, startHour, endHour };
}

export async function getBusinessHours(): Promise<BusinessHours> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "contact.hours" } });
    return parseBusinessHours(row?.value);
  } catch {
    return DEFAULT_HOURS;
  }
}

export function toKstDate(now: Date = new Date()): Date {
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utc + KST_OFFSET_MIN * 60_000);
}

export function isOutsideBusinessHours(hours: BusinessHours, now: Date = new Date()): boolean {
  const kst = toKstDate(now);
  const day = kst.getDay(); // 0=Sun, 6=Sat
  const hour = kst.getHours();
  if (hours.weekdaysOnly && (day === 0 || day === 6)) return true;
  if (hour < hours.startHour || hour >= hours.endHour) return true;
  return false;
}

// ── Next business time ─────────────────────────────────────────
export function computeNextBusinessOpen(hours: BusinessHours, now: Date = new Date()): Date {
  const kst = toKstDate(now);
  const d = new Date(kst);
  d.setSeconds(0, 0);
  // If same day but before start
  if (d.getHours() < hours.startHour && !(hours.weekdaysOnly && (d.getDay() === 0 || d.getDay() === 6))) {
    d.setHours(hours.startHour, 0, 0, 0);
    return d;
  }
  // Advance to next day
  d.setDate(d.getDate() + 1);
  d.setHours(hours.startHour, 0, 0, 0);
  while (hours.weekdaysOnly && (d.getDay() === 0 || d.getDay() === 6)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function formatKst(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${y}-${m}-${day}(${weekday}) ${h}:${mi} KST`;
}

// ── AI response generation ─────────────────────────────────────
export type AfterHoursContext = {
  contactName: string;
  inquiryType?: string;
  message?: string;
  kakaoUrl?: string;
  naverTalkUrl?: string;
};

export type AfterHoursResponse = {
  subject: string;
  body: string;
  nextOpenAt: string;
  usedAi: boolean;
};

const CATEGORY_HINTS: Record<string, string> = {
  FOREIGNER_VISA: "비자·체류 사안은 신청 유형/현재 체류자격/신청 기간에 따라 착수 30~150만원 대역이 일반적입니다.",
  IMMIGRATION_STAY: "체류/출입국 사안은 사실관계·서류 유무에 따라 30~120만원 대역입니다.",
  APOSTILLE_CONSULAR: "아포스티유·영사확인은 서류 수/국가에 따라 건당 8~35만원 대역입니다.",
  TRANSLATION_NOTARY: "번역·공증은 언어/분량에 따라 건당 5~40만원 대역입니다.",
  GENERAL_ADMIN_CIVIL: "일반 행정민원은 사안 성격에 따라 20~80만원 대역입니다.",
  CORPORATE_REQUEST: "법인·인허가 요청은 업종/등기 유무에 따라 100~500만원 대역입니다.",
};

function buildFallback(ctx: AfterHoursContext, nextOpen: Date, hours: BusinessHours): string {
  const nameLine = ctx.contactName ? `${ctx.contactName}님, ` : "";
  const nextLine = `다음 영업일 ${formatKst(nextOpen)}부터 순차 회신드립니다.`;
  const hint = ctx.inquiryType && CATEGORY_HINTS[ctx.inquiryType]
    ? `\n\n[예상 견적 힌트] ${CATEGORY_HINTS[ctx.inquiryType]}`
    : "";
  const urgent: string[] = [];
  if (ctx.kakaoUrl) urgent.push(`카카오톡: ${ctx.kakaoUrl}`);
  if (ctx.naverTalkUrl) urgent.push(`네이버 톡톡: ${ctx.naverTalkUrl}`);
  const urgentLine = urgent.length
    ? `\n\n[긴급 사안이라면] 아래 채널로도 문의 가능합니다.\n- ${urgent.join("\n- ")}`
    : "";
  return `${nameLine}문의가 정상 접수되었습니다.\n\n현재 영업시간(${hours.raw}) 외 시간이라 즉시 응대가 어렵습니다. ${nextLine}${hint}${urgentLine}\n\n감사합니다.\n행정사 ETHOS`;
}

async function callHaiku(ctx: AfterHoursContext, nextOpen: Date, hours: BusinessHours): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const systemPrompt =
    "너는 한국 행정사사무소 ETHOS의 야간·주말 자동 응대 어시스턴트다. 접수된 문의에 정중하고 전문적인 한국어 응답을 작성한다. " +
    "다음 요건을 반드시 포함하라: (1) 정상 접수되었음을 확인, (2) 다음 영업일 회신 예정 시각 명시, (3) 문의 유형에 맞는 예상 견적 대역 힌트 1문장, (4) 긴급 시 카카오톡/네이버톡톡 안내. " +
    "과장·확답 금지. 5-8문장, 200-350자, 마크다운 없이 일반 텍스트로만.";

  const userPrompt = [
    `고객명: ${ctx.contactName || "고객님"}`,
    `문의 유형: ${ctx.inquiryType || "미분류"}`,
    `문의 내용 요약: ${(ctx.message || "").slice(0, 300)}`,
    `현재 영업시간: ${hours.raw}`,
    `다음 회신 예정: ${formatKst(nextOpen)}`,
    `카카오 URL: ${ctx.kakaoUrl || "(없음)"}`,
    `네이버 톡톡 URL: ${ctx.naverTalkUrl || "(없음)"}`,
    `예상 견적 힌트 카테고리 참고: ${CATEGORY_HINTS[ctx.inquiryType || ""] || "(카테고리 불명 — 상담 후 안내)"}`,
  ].join("\n");

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      logger.warn("[after-hours-ai] api error", { status: res.status, body: txt.slice(0, 300) });
      return null;
    }
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
    return text || null;
  } catch (err) {
    logger.warn("[after-hours-ai] failed", err);
    return null;
  }
}

export async function generateAfterHoursResponse(
  ctx: AfterHoursContext
): Promise<AfterHoursResponse> {
  const hours = await getBusinessHours();
  const nextOpen = computeNextBusinessOpen(hours);
  const aiBody = await callHaiku(ctx, nextOpen, hours);
  const body = aiBody ?? buildFallback(ctx, nextOpen, hours);
  return {
    subject: "[ETHOS] 문의 접수 완료 — 다음 영업일 회신 예정",
    body,
    nextOpenAt: formatKst(nextOpen),
    usedAi: Boolean(aiBody),
  };
}

/** True if request should trigger after-hours auto-reply. */
export async function shouldTriggerAfterHours(now: Date = new Date()): Promise<boolean> {
  const hours = await getBusinessHours();
  return isOutsideBusinessHours(hours, now);
}
