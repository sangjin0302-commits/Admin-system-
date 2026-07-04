/**
 * Partner referral program.
 *
 * Storage strategy: SiteSetting JSON blobs (no schema migration).
 *   - "partners.list"        → PartnerRecord[]           (approved + pending)
 *   - "partners.commissions" → CommissionEntry[]         (one per case closure)
 */

import { prisma } from "@/lib/prisma/client";

export type PartnerCategory = "lawyer" | "tax" | "accountant" | "other";
export type PartnerStatus = "pending" | "approved" | "rejected" | "suspended";

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  email: string;
  phone?: string;
  referralCode: string;
  commissionRate: number; // 0..1 (e.g. 0.10 = 10%)
  joinedAt: string; // ISO date
  status: PartnerStatus;
  expectedMonthlyReferrals?: number;
  notes?: string;
}

export interface CommissionEntry {
  id: string;
  partnerId: string;
  referralCode: string;
  inquiryId?: string;
  caseMatterId: string;
  fee: number;
  rate: number;
  amount: number; // fee * rate, rounded
  createdAt: string;
  paid: boolean;
  paidAt?: string;
}

const PARTNERS_KEY = "partners.list";
const COMMISSIONS_KEY = "partners.commissions";

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Deterministic-ish uppercase alpha-num code (8 chars). */
export function generateReferralCode(seed?: string): string {
  const s = (seed ?? "") + Date.now().toString(36) + Math.random().toString(36);
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  let n = Math.abs(hash);
  for (let i = 0; i < 8; i++) {
    code += alpha[n % alpha.length];
    n = Math.floor(n / alpha.length) + i + 1;
  }
  return code;
}

async function readJsonSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (!row || !row.value) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonSetting(key: string, value: unknown, updatedBy?: string): Promise<void> {
  const v = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: v, updatedBy: updatedBy ?? null },
    update: { value: v, updatedBy: updatedBy ?? null },
  });
}

export async function listPartners(): Promise<Partner[]> {
  return readJsonSetting<Partner[]>(PARTNERS_KEY, []);
}

export async function findPartnerByCode(code: string): Promise<Partner | null> {
  if (!code) return null;
  const partners = await listPartners();
  const normalized = code.trim().toUpperCase();
  return partners.find((p) => p.referralCode.toUpperCase() === normalized) ?? null;
}

export async function createPartnerApplication(input: {
  name: string;
  category: PartnerCategory;
  email: string;
  phone?: string;
  expectedMonthlyReferrals?: number;
  notes?: string;
}): Promise<Partner> {
  const partners = await listPartners();
  const partner: Partner = {
    id: newId("ptn"),
    name: input.name.trim(),
    category: input.category,
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim(),
    referralCode: generateReferralCode(input.email + input.name),
    commissionRate: 0.1,
    joinedAt: new Date().toISOString(),
    status: "pending",
    expectedMonthlyReferrals: input.expectedMonthlyReferrals,
    notes: input.notes?.trim(),
  };
  partners.push(partner);
  await writeJsonSetting(PARTNERS_KEY, partners);
  return partner;
}

export async function updatePartner(
  id: string,
  patch: Partial<Omit<Partner, "id" | "joinedAt" | "referralCode">> & { referralCode?: string }
): Promise<Partner | null> {
  const partners = await listPartners();
  const idx = partners.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const updated: Partner = { ...partners[idx], ...patch };
  partners[idx] = updated;
  await writeJsonSetting(PARTNERS_KEY, partners);
  return updated;
}

export async function approvePartner(id: string): Promise<Partner | null> {
  return updatePartner(id, { status: "approved" });
}

export async function listCommissions(): Promise<CommissionEntry[]> {
  return readJsonSetting<CommissionEntry[]>(COMMISSIONS_KEY, []);
}

/**
 * Record a commission for a closed case. Idempotent per caseMatterId +
 * partnerId — repeat calls with the same pair are ignored.
 */
export async function recordCommissionForClosedCase(input: {
  caseMatterId: string;
  fee: number;
  referralCode: string;
  inquiryId?: string;
}): Promise<CommissionEntry | null> {
  const partner = await findPartnerByCode(input.referralCode);
  if (!partner || partner.status !== "approved") return null;

  const commissions = await listCommissions();
  const existing = commissions.find(
    (c) => c.caseMatterId === input.caseMatterId && c.partnerId === partner.id
  );
  if (existing) return existing;

  const rate = partner.commissionRate;
  const entry: CommissionEntry = {
    id: newId("com"),
    partnerId: partner.id,
    referralCode: partner.referralCode,
    inquiryId: input.inquiryId,
    caseMatterId: input.caseMatterId,
    fee: input.fee,
    rate,
    amount: Math.round(input.fee * rate),
    createdAt: new Date().toISOString(),
    paid: false,
  };
  commissions.push(entry);
  await writeJsonSetting(COMMISSIONS_KEY, commissions);
  return entry;
}

export async function markCommissionPaid(id: string): Promise<CommissionEntry | null> {
  const commissions = await listCommissions();
  const idx = commissions.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  commissions[idx] = { ...commissions[idx], paid: true, paidAt: new Date().toISOString() };
  await writeJsonSetting(COMMISSIONS_KEY, commissions);
  return commissions[idx];
}

export interface PartnerStats {
  partner: Partner;
  referralCount: number;
  commissionEarned: number;
  commissionUnpaid: number;
}

export async function getPartnerStats(): Promise<PartnerStats[]> {
  const [partners, commissions] = await Promise.all([listPartners(), listCommissions()]);
  return partners.map((p) => {
    const rel = commissions.filter((c) => c.partnerId === p.id);
    const earned = rel.reduce((a, c) => a + c.amount, 0);
    const unpaid = rel.filter((c) => !c.paid).reduce((a, c) => a + c.amount, 0);
    return {
      partner: p,
      referralCount: rel.length,
      commissionEarned: earned,
      commissionUnpaid: unpaid,
    };
  });
}
