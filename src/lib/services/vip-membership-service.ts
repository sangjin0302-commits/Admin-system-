/**
 * VIP 회원제 (월 구독) — 인간 프리미엄 서비스.
 * AI 구독(ai-subscription-service)과는 별개: 인간 우선 응대·전담·할인.
 * Storage: SiteSetting JSON blobs.
 *   - "vip.memberships"  → Record<userId, VipMembership>
 *   - "vip.plans"        → optional custom price overrides (Record<VipPlan, PlanConfig>)
 */

import { prisma } from "@/lib/prisma/client";

export type VipPlan = "silver" | "gold" | "platinum";

export interface VipPlanConfig {
  plan: VipPlan;
  label: string;
  priceKrw: number;
  discountPct: number;              // 견적 자동 할인 %
  inquiryQuota: number;             // -1 = unlimited
  benefits: string[];
  slaHours: number;                 // 응대 SLA 시간
}

const DEFAULT_PLANS: Record<VipPlan, VipPlanConfig> = {
  silver: {
    plan: "silver",
    label: "Silver",
    priceKrw: 99_000,
    discountPct: 20,
    inquiryQuota: -1,
    benefits: [
      "우선 처리 20% 할인",
      "무제한 문의",
      "전용 응대 라인"
    ],
    slaHours: 48,
  },
  gold: {
    plan: "gold",
    label: "Gold",
    priceKrw: 290_000,
    discountPct: 25,
    inquiryQuota: -1,
    benefits: [
      "Silver 전 혜택",
      "전담 매니저 배정",
      "24시간 내 응대"
    ],
    slaHours: 24,
  },
  platinum: {
    plan: "platinum",
    label: "Platinum",
    priceKrw: 490_000,
    discountPct: 30,
    inquiryQuota: -1,
    benefits: [
      "Gold 전 혜택",
      "무제한 화상 상담",
      "세미나·컨퍼런스 우선 초청"
    ],
    slaHours: 12,
  },
};

export interface VipBenefitsUsed {
  inquiriesThisMonth: number;
  consultationsThisMonth: number;
  discountAppliedKrw: number;
  monthKey: string; // YYYY-MM (for reset detection)
}

export interface VipMembership {
  userId: string;
  plan: VipPlan;
  startedAt: string;
  expiresAt: string;
  monthlyBilling: boolean;
  benefitsUsed: VipBenefitsUsed;
  cancelledAt?: string;
}

const MEMBERSHIPS_KEY = "vip.memberships";
const PLANS_KEY = "vip.plans";

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (!row || !row.value) return fallback;
  try { return JSON.parse(row.value) as T; } catch { return fallback; }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const v = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: v },
    update: { value: v },
  });
}

export async function getVipPlans(): Promise<Record<VipPlan, VipPlanConfig>> {
  const overrides = await readJson<Partial<Record<VipPlan, VipPlanConfig>>>(PLANS_KEY, {});
  return {
    silver: { ...DEFAULT_PLANS.silver, ...(overrides.silver ?? {}) },
    gold: { ...DEFAULT_PLANS.gold, ...(overrides.gold ?? {}) },
    platinum: { ...DEFAULT_PLANS.platinum, ...(overrides.platinum ?? {}) },
  };
}

async function readMemberships(): Promise<Record<string, VipMembership>> {
  return readJson<Record<string, VipMembership>>(MEMBERSHIPS_KEY, {});
}

function emptyBenefits(): VipBenefitsUsed {
  return { inquiriesThisMonth: 0, consultationsThisMonth: 0, discountAppliedKrw: 0, monthKey: monthKey() };
}

function rollBenefits(b: VipBenefitsUsed | undefined): VipBenefitsUsed {
  const now = monthKey();
  if (!b) return emptyBenefits();
  if (b.monthKey !== now) return emptyBenefits();
  return b;
}

/** Returns active plan (null if user is not VIP or has cancelled/expired). */
export async function getPlan(userId: string): Promise<VipMembership | null> {
  const map = await readMemberships();
  const m = map[userId];
  if (!m) return null;
  if (m.cancelledAt) return null;
  if (new Date(m.expiresAt).getTime() < Date.now()) return null;
  return { ...m, benefitsUsed: rollBenefits(m.benefitsUsed) };
}

export async function subscribeVip(userId: string, plan: VipPlan): Promise<VipMembership> {
  const map = await readMemberships();
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const record: VipMembership = {
    userId,
    plan,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    monthlyBilling: true,
    benefitsUsed: emptyBenefits(),
  };
  map[userId] = record;
  await writeJson(MEMBERSHIPS_KEY, map);
  return record;
}

export async function cancelVip(userId: string): Promise<void> {
  const map = await readMemberships();
  const m = map[userId];
  if (!m) return;
  map[userId] = { ...m, cancelledAt: new Date().toISOString() };
  await writeJson(MEMBERSHIPS_KEY, map);
}

export async function listActiveVips(): Promise<VipMembership[]> {
  const map = await readMemberships();
  const now = Date.now();
  return Object.values(map).filter(
    (m) => !m.cancelledAt && new Date(m.expiresAt).getTime() >= now
  );
}

/** Apply VIP discount to a quote total. Returns updated total + discount amount. */
export async function applyVipDiscount(
  quoteTotalKrw: number,
  userId: string | null | undefined
): Promise<{ discountedTotal: number; discountKrw: number; plan: VipPlan | null }> {
  if (!userId) return { discountedTotal: quoteTotalKrw, discountKrw: 0, plan: null };
  const membership = await getPlan(userId);
  if (!membership) return { discountedTotal: quoteTotalKrw, discountKrw: 0, plan: null };
  const plans = await getVipPlans();
  const config = plans[membership.plan];
  const discount = Math.round((quoteTotalKrw * config.discountPct) / 100);
  // Track discount used (best-effort, non-blocking)
  const map = await readMemberships();
  const m = map[userId];
  if (m) {
    const b = rollBenefits(m.benefitsUsed);
    b.discountAppliedKrw += discount;
    map[userId] = { ...m, benefitsUsed: b };
    await writeJson(MEMBERSHIPS_KEY, map);
  }
  return { discountedTotal: quoteTotalKrw - discount, discountKrw: discount, plan: membership.plan };
}

/** Priority elevation helper: returns "CRITICAL" for any active VIP. */
export async function vipPriorityFor(userId: string | null | undefined): Promise<"CRITICAL" | null> {
  if (!userId) return null;
  const m = await getPlan(userId);
  return m ? "CRITICAL" : null;
}

export async function recordVipInquiry(userId: string): Promise<void> {
  const map = await readMemberships();
  const m = map[userId];
  if (!m) return;
  const b = rollBenefits(m.benefitsUsed);
  b.inquiriesThisMonth += 1;
  map[userId] = { ...m, benefitsUsed: b };
  await writeJson(MEMBERSHIPS_KEY, map);
}
