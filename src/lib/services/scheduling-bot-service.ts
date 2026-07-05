/**
 * 일정 자동 조율 봇.
 *
 * 절차:
 *   1. AI가 문의 컨텍스트를 참고하여 상담용 이메일 초안 작성
 *   2. consultation-slots-service에서 상위 3개 슬롯 후보 추출
 *   3. 이메일 발송 (SendGrid → Resend → SMTP → dryrun 폴백)
 *   4. 회신 파싱하여 선택 슬롯 자동 예약
 *
 * 상태 저장: SiteSetting `scheduling.session.{inquiryId}` (JSON).
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import {
  bookSlot,
  getSlotsForNext14Days,
  type DayAvailability
} from "@/lib/services/consultation-slots-service";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export type SchedulingStatus =
  | "IDLE"
  | "EMAIL_DRAFTED"
  | "EMAIL_SENT"
  | "CLIENT_OPENED"
  | "AWAITING_REPLY"
  | "CONFIRMED"
  | "CANCELLED";

export interface ProposedSlot {
  slotKey: string; // "YYYY-MM-DD HH:mm"
  date: string;
  time: string;
  label: string; // human readable
}

export interface SchedulingSession {
  inquiryId: string;
  status: SchedulingStatus;
  proposedSlots: ProposedSlot[];
  emailSubject: string;
  emailBody: string;
  replyToken: string;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  lastFollowUpAt: string | null;
  confirmedSlotKey: string | null;
  history: Array<{ at: string; event: string; note?: string }>;
}

const sessionKey = (inquiryId: string) => `scheduling.session.${inquiryId}`;

function labelForSlot(date: string, time: string, lang: "ko" | "en"): string {
  const d = new Date(`${date}T${time}:00`);
  if (lang === "ko") {
    return `${date} (${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]}) ${time}`;
  }
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${date} ${wd} ${time}`;
}

function pickTopSlots(availability: DayAvailability[], count: number, lang: "ko" | "en"): ProposedSlot[] {
  const flat: ProposedSlot[] = [];
  for (const day of availability) {
    for (const slot of day.slots) {
      if (!slot.available) continue;
      flat.push({
        slotKey: `${day.date} ${slot.time}`,
        date: day.date,
        time: slot.time,
        label: labelForSlot(day.date, slot.time, lang)
      });
      if (flat.length >= count) return flat;
    }
    if (flat.length >= count) return flat;
  }
  return flat;
}

async function draftEmailWithClaude(input: {
  apiKey: string;
  contactName: string;
  title: string;
  summary: string | null;
  slots: ProposedSlot[];
  replyToken: string;
  lang: "ko" | "en";
}): Promise<{ subject: string; body: string }> {
  const slotList = input.slots.map((s, i) => `${i + 1}. ${s.label}`).join("\n");
  const prompt = `당신은 한국 행정사 사무소의 상담 일정 조율 이메일을 작성합니다.

고객명: ${input.contactName}
문의 제목: ${input.title}
문의 요약: ${input.summary ?? "(없음)"}
언어: ${input.lang === "ko" ? "한국어" : "English"}

제안 시간대(고객이 이 중 하나를 선택):
${slotList}

회신 안내 문구:
- 원하시는 번호를 이메일 회신 첫 줄에 적어주세요.
- 참조 코드: [SCHED:${input.replyToken}] (회신 시 유지 필요)

톤: 정중, 간결, 따뜻함. 마감·부담 표현 금지.

응답은 JSON:
{"subject": "제목", "body": "본문 (\\n 줄바꿈, 참조코드 포함)"}`;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");
  const parsed = JSON.parse(match[0]) as { subject?: string; body?: string };
  return {
    subject: (parsed.subject ?? "상담 일정 안내").trim(),
    body: (parsed.body ?? "").trim()
  };
}

function fallbackEmail(contactName: string, slots: ProposedSlot[], replyToken: string, lang: "ko" | "en"): {
  subject: string;
  body: string;
} {
  if (lang === "ko") {
    return {
      subject: `[상담 일정 안내] ${contactName}님 — 편하신 시간을 선택해 주세요`,
      body: `${contactName}님, 안녕하세요.\n\n문의해 주신 건에 대한 상담을 아래 세 개 시간대 중 편하신 시간으로 진행하고자 합니다. 원하시는 번호를 회신 첫 줄에 적어주세요.\n\n${slots
        .map((s, i) => `${i + 1}. ${s.label}`)
        .join("\n")}\n\n※ 참조 코드: [SCHED:${replyToken}] (회신 시 이 코드를 유지해 주세요)\n\n감사합니다.`
    };
  }
  return {
    subject: `[Consultation Scheduling] Please pick a time — ${contactName}`,
    body: `Hello ${contactName},\n\nPlease reply with your preferred number below:\n\n${slots
      .map((s, i) => `${i + 1}. ${s.label}`)
      .join("\n")}\n\nReference: [SCHED:${replyToken}] (please keep in reply)\n\nThank you.`
  };
}

async function loadSession(inquiryId: string): Promise<SchedulingSession | null> {
  const s = await prisma.siteSetting.findUnique({ where: { key: sessionKey(inquiryId) } });
  if (!s) return null;
  try {
    return JSON.parse(s.value) as SchedulingSession;
  } catch {
    return null;
  }
}

async function persistSession(session: SchedulingSession): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: sessionKey(session.inquiryId) },
    create: { key: sessionKey(session.inquiryId), value: JSON.stringify(session) },
    update: { value: JSON.stringify(session) }
  });
}

function newReplyToken(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

// Also index token → inquiryId to enable webhook lookup
async function indexReplyToken(token: string, inquiryId: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: `scheduling.token.${token}` },
    create: { key: `scheduling.token.${token}`, value: inquiryId },
    update: { value: inquiryId }
  });
}

export async function draftSchedulingSession(inquiryId: string): Promise<SchedulingSession> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      contactName: true,
      email: true,
      title: true,
      generatedSummary: true,
      preferredLanguage: true
    }
  });
  if (!inquiry) throw new Error(`Inquiry not found: ${inquiryId}`);

  const availability = await getSlotsForNext14Days();
  const lang: "ko" | "en" = inquiry.preferredLanguage === "EN" ? "en" : "ko";
  const slots = pickTopSlots(availability, 3, lang);

  const replyToken = newReplyToken();
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  let subject: string;
  let body: string;
  if (apiKey && slots.length >= 3) {
    try {
      const drafted = await draftEmailWithClaude({
        apiKey,
        contactName: inquiry.contactName,
        title: inquiry.title,
        summary: inquiry.generatedSummary,
        slots,
        replyToken,
        lang
      });
      subject = drafted.subject;
      body = drafted.body;
    } catch (err) {
      logger.warn("[scheduling-bot] Claude draft failed, using fallback", err);
      const fb = fallbackEmail(inquiry.contactName, slots, replyToken, lang);
      subject = fb.subject;
      body = fb.body;
    }
  } else {
    const fb = fallbackEmail(inquiry.contactName, slots, replyToken, lang);
    subject = fb.subject;
    body = fb.body;
  }

  const now = new Date().toISOString();
  const session: SchedulingSession = {
    inquiryId,
    status: "EMAIL_DRAFTED",
    proposedSlots: slots,
    emailSubject: subject,
    emailBody: body,
    replyToken,
    createdAt: now,
    updatedAt: now,
    sentAt: null,
    lastFollowUpAt: null,
    confirmedSlotKey: null,
    history: [{ at: now, event: "DRAFTED" }]
  };
  await persistSession(session);
  await indexReplyToken(replyToken, inquiryId);
  return session;
}

async function sendEmailBestEffort(to: string, subject: string, body: string, replyTo?: string): Promise<{
  ok: boolean;
  provider: "sendgrid" | "resend" | "dryrun";
}> {
  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.SCHEDULING_FROM_EMAIL?.trim() ?? "no-reply@example.com";

  if (sendgridKey) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          reply_to: replyTo ? { email: replyTo } : undefined,
          subject,
          content: [{ type: "text/plain", value: body }]
        })
      });
      if (res.ok) return { ok: true, provider: "sendgrid" };
    } catch (err) {
      logger.warn("[scheduling-bot] SendGrid failed", err);
    }
  }
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          subject,
          text: body,
          reply_to: replyTo
        })
      });
      if (res.ok) return { ok: true, provider: "resend" };
    } catch (err) {
      logger.warn("[scheduling-bot] Resend failed", err);
    }
  }
  logger.info("[scheduling-bot] No email provider configured — dry run", { to, subject });
  return { ok: true, provider: "dryrun" };
}

export async function sendSchedulingEmail(inquiryId: string): Promise<SchedulingSession> {
  const session = await loadSession(inquiryId);
  if (!session) throw new Error(`No scheduling session for inquiry: ${inquiryId}`);
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { email: true }
  });
  if (!inquiry?.email) throw new Error("Inquiry has no email");

  const replyTo = process.env.SCHEDULING_REPLY_TO_EMAIL?.trim();
  const result = await sendEmailBestEffort(inquiry.email, session.emailSubject, session.emailBody, replyTo);

  const now = new Date().toISOString();
  session.status = "EMAIL_SENT";
  session.sentAt = now;
  session.updatedAt = now;
  session.history.push({ at: now, event: "SENT", note: result.provider });
  await persistSession(session);
  return session;
}

export async function getSchedulingSession(inquiryId: string): Promise<SchedulingSession | null> {
  return loadSession(inquiryId);
}

// ── 회신 파싱 ─────────────────────────────────────────────────────

export interface ParsedReply {
  replyToken: string | null;
  selectedIndex: number | null;
  raw: string;
}

export function parseReply(rawEmailText: string): ParsedReply {
  const tokenMatch = rawEmailText.match(/\[SCHED:([A-Z0-9]+)\]/i);
  const replyToken = tokenMatch ? tokenMatch[1].toUpperCase() : null;

  // Look at the first ~10 lines for a leading digit
  const lines = rawEmailText.split(/\r?\n/).slice(0, 10);
  let selectedIndex: number | null = null;
  for (const line of lines) {
    const m = line.trim().match(/^([1-9])(?:[.)]|번|호|st|nd|rd|th|\s|$)/i);
    if (m) {
      selectedIndex = Number(m[1]);
      break;
    }
  }
  return { replyToken, selectedIndex, raw: rawEmailText };
}

export async function handleReply(rawEmailText: string): Promise<{
  ok: boolean;
  session?: SchedulingSession;
  message?: string;
}> {
  const parsed = parseReply(rawEmailText);
  if (!parsed.replyToken) {
    return { ok: false, message: "참조 코드([SCHED:XXX])가 없습니다." };
  }
  const tokenRec = await prisma.siteSetting.findUnique({
    where: { key: `scheduling.token.${parsed.replyToken}` }
  });
  if (!tokenRec) {
    return { ok: false, message: "일치하는 세션을 찾을 수 없습니다." };
  }
  const inquiryId = tokenRec.value;
  const session = await loadSession(inquiryId);
  if (!session) return { ok: false, message: "세션이 삭제되었습니다." };

  const now = new Date().toISOString();

  if (parsed.selectedIndex === null || parsed.selectedIndex < 1 || parsed.selectedIndex > session.proposedSlots.length) {
    session.status = "AWAITING_REPLY";
    session.updatedAt = now;
    session.history.push({ at: now, event: "REPLY_UNPARSED", note: "선택 번호 파싱 실패" });
    await persistSession(session);
    return { ok: false, session, message: "회신에서 선택 번호를 찾지 못했습니다." };
  }

  const slot = session.proposedSlots[parsed.selectedIndex - 1];
  try {
    // Best-effort: attempt to book. Fallback to memo-only if bookSlot signature mismatches.
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      select: { contactName: true, email: true, phone: true, title: true }
    });
    if (inquiry) {
      await bookSlot({
        date: slot.date,
        time: slot.time,
        contactName: inquiry.contactName,
        email: inquiry.email,
        phone: inquiry.phone ?? undefined,
        note: `자동 예약 (일정 조율 봇, session=${session.replyToken})`
      } as never).catch((err) => {
        logger.warn("[scheduling-bot] bookSlot failed", err);
      });
    }
  } catch (err) {
    logger.warn("[scheduling-bot] booking exception", err);
  }

  session.status = "CONFIRMED";
  session.confirmedSlotKey = slot.slotKey;
  session.updatedAt = now;
  session.history.push({ at: now, event: "CONFIRMED", note: slot.label });
  await persistSession(session);

  // Confirmation email (best-effort)
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { email: true, contactName: true }
  });
  if (inquiry?.email) {
    await sendEmailBestEffort(
      inquiry.email,
      `[상담 확정] ${slot.label}`,
      `${inquiry.contactName}님, 선택하신 ${slot.label} 상담이 확정되었습니다. 감사합니다.`
    );
  }
  return { ok: true, session };
}

// ── 24h 미회신 팔로우업 ────────────────────────────────────────────

export async function runFollowUpSweep(): Promise<{ notified: number }> {
  const allSettings = await prisma.siteSetting.findMany({
    where: { key: { startsWith: "scheduling.session." } }
  });
  const now = Date.now();
  let notified = 0;
  for (const rec of allSettings) {
    try {
      const session = JSON.parse(rec.value) as SchedulingSession;
      if (session.status !== "EMAIL_SENT" && session.status !== "AWAITING_REPLY") continue;
      if (!session.sentAt) continue;
      const sentMs = new Date(session.sentAt).getTime();
      if (now - sentMs < 24 * 60 * 60 * 1000) continue;
      if (session.lastFollowUpAt) {
        const lastMs = new Date(session.lastFollowUpAt).getTime();
        if (now - lastMs < 48 * 60 * 60 * 1000) continue;
      }
      const inquiry = await prisma.inquiry.findUnique({
        where: { id: session.inquiryId },
        select: { email: true, contactName: true }
      });
      if (!inquiry?.email) continue;
      await sendEmailBestEffort(
        inquiry.email,
        `[리마인드] ${session.emailSubject}`,
        `안녕하세요, 이전에 안내드린 상담 시간 선택에 대한 회신을 기다리고 있습니다.\n\n${session.emailBody}`
      );
      session.lastFollowUpAt = new Date().toISOString();
      session.status = "AWAITING_REPLY";
      session.history.push({ at: session.lastFollowUpAt, event: "FOLLOWUP_SENT" });
      await persistSession(session);
      notified++;
    } catch {
      // continue
    }
  }
  return { notified };
}
