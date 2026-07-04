/**
 * AI legal-advice subscription SaaS.
 * Storage: SiteSetting JSON blobs.
 *   - "ai_sub.subscriptions" → SubscriptionRecord[]  (per userId/email)
 *   - "ai_sub.usage"         → UsageRecord           map keyed by userId + YYYY-MM
 */

import { prisma } from "@/lib/prisma/client";

export type PlanTier = "free" | "pro";

export interface PlanDef {
  tier: PlanTier;
  label: string;
  priceKrw: number;
  monthlyQuota: number; // -1 = unlimited
}

export const PLANS: Record<PlanTier, PlanDef> = {
  free: { tier: "free", label: "Free", priceKrw: 0, monthlyQuota: 5 },
  pro: { tier: "pro", label: "Pro", priceKrw: 9900, monthlyQuota: -1 },
};

export interface SubscriptionRecord {
  userId: string; // email or portal client id
  tier: PlanTier;
  startedAt: string;
  renewsAt?: string;
  cancelledAt?: string;
}

type UsageMap = Record<string, number>; // key = `${userId}:${YYYY-MM}` → count

const SUBS_KEY = "ai_sub.subscriptions";
const USAGE_KEY = "ai_sub.usage";

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (!row || !row.value) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const v = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: v },
    update: { value: v },
  });
}

export async function getSubscription(userId: string): Promise<SubscriptionRecord> {
  const list = await readJson<SubscriptionRecord[]>(SUBS_KEY, []);
  const found = list.find((s) => s.userId === userId && !s.cancelledAt);
  if (found) return found;
  return { userId, tier: "free", startedAt: new Date().toISOString() };
}

export async function setSubscription(record: SubscriptionRecord): Promise<SubscriptionRecord> {
  const list = await readJson<SubscriptionRecord[]>(SUBS_KEY, []);
  const idx = list.findIndex((s) => s.userId === record.userId);
  if (idx >= 0) list[idx] = record;
  else list.push(record);
  await writeJson(SUBS_KEY, list);
  return record;
}

export async function cancelSubscription(userId: string): Promise<void> {
  const list = await readJson<SubscriptionRecord[]>(SUBS_KEY, []);
  const idx = list.findIndex((s) => s.userId === userId && !s.cancelledAt);
  if (idx < 0) return;
  list[idx] = { ...list[idx], cancelledAt: new Date().toISOString(), tier: "free" };
  await writeJson(SUBS_KEY, list);
}

export interface UsageSummary {
  userId: string;
  tier: PlanTier;
  monthKey: string;
  used: number;
  quota: number; // -1 = unlimited
  remaining: number; // -1 = unlimited
}

export async function getUsage(userId: string): Promise<UsageSummary> {
  const [sub, usage] = await Promise.all([
    getSubscription(userId),
    readJson<UsageMap>(USAGE_KEY, {}),
  ]);
  const mk = monthKey();
  const used = usage[`${userId}:${mk}`] ?? 0;
  const quota = PLANS[sub.tier].monthlyQuota;
  const remaining = quota < 0 ? -1 : Math.max(0, quota - used);
  return { userId, tier: sub.tier, monthKey: mk, used, quota, remaining };
}

/**
 * Consume one usage credit. Returns the updated summary or `null` if the
 * user is out of quota (caller should reject).
 */
export async function incrementUsage(userId: string): Promise<UsageSummary | null> {
  const before = await getUsage(userId);
  if (before.quota >= 0 && before.remaining <= 0) return null;
  const usage = await readJson<UsageMap>(USAGE_KEY, {});
  const k = `${userId}:${before.monthKey}`;
  usage[k] = (usage[k] ?? 0) + 1;
  await writeJson(USAGE_KEY, usage);
  return getUsage(userId);
}

/** Cheap boolean check without incrementing. */
export async function checkQuota(userId: string): Promise<boolean> {
  const u = await getUsage(userId);
  return u.quota < 0 || u.remaining > 0;
}
