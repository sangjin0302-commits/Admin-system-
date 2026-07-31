/**
 * Resend 무료 한도 가드.
 *
 * Resend Free: 월 3,000통 / 일 100통. 유료(Pro $20/mo)로 자동 전환되는 것을 막기 위해
 * 보수적 한도(월 2,900 / 일 95) 아래에서만 자동 발송하고, 초과 시 발송을 건너뛴다.
 * 초과분은 관리자가 직접 메일로 보내면 됨(자동 결제 방지).
 *
 * 카운트는 SiteSetting 에 기간 키로 저장 → 새 달/날짜가 되면 키가 바뀌어 자연 리셋.
 * (Resend 계정 주기와 정확히 일치하진 않지만, 한도를 넉넉히 밑돌게 잡아 안전.)
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const DEFAULT_MONTHLY_CAP = 2900;
const DEFAULT_DAILY_CAP = 95;

function monthlyCap(): number {
  const v = Number.parseInt(process.env.EMAIL_FREE_MONTHLY_CAP ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_MONTHLY_CAP;
}

function dailyCap(): number {
  const v = Number.parseInt(process.env.EMAIL_FREE_DAILY_CAP ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_DAILY_CAP;
}

function periodKeys(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return {
    monthKey: `email.sent.month.${y}-${m}`,
    dayKey: `email.sent.day.${y}-${m}-${d}`
  };
}

async function readCount(key: string): Promise<number> {
  const row = await prisma.siteSetting.findUnique({ where: { key }, select: { value: true } }).catch(() => null);
  const n = Number.parseInt(row?.value ?? "0", 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export type FreeQuotaCheck = { ok: boolean; reason?: "monthly_cap" | "daily_cap"; month: number; day: number };

/** 무료 한도 내인지 확인. 초과면 ok:false. */
export async function canSendFreeEmail(now = new Date()): Promise<FreeQuotaCheck> {
  const { monthKey, dayKey } = periodKeys(now);
  const [month, day] = await Promise.all([readCount(monthKey), readCount(dayKey)]);
  if (month >= monthlyCap()) return { ok: false, reason: "monthly_cap", month, day };
  if (day >= dailyCap()) return { ok: false, reason: "daily_cap", month, day };
  return { ok: true, month, day };
}

/** 발송 성공 후 카운트 1 증가(월·일). best-effort. */
export async function recordEmailSent(now = new Date()): Promise<void> {
  const { monthKey, dayKey } = periodKeys(now);
  try {
    await prisma.$transaction(async (tx) => {
      for (const key of [monthKey, dayKey]) {
        const row = await tx.siteSetting.findUnique({ where: { key }, select: { value: true } });
        const next = (Number.parseInt(row?.value ?? "0", 10) || 0) + 1;
        await tx.siteSetting.upsert({
          where: { key },
          create: { key, value: String(next) },
          update: { value: String(next) }
        });
      }
    });
  } catch (err) {
    logger.warn("[email-quota] record failed", err);
  }
}
