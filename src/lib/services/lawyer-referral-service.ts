/**
 * 소송 지원 파트너 변호사 매칭.
 * Storage:
 *   "lawyers.partners"    → PartnerLawyer[]
 *   "lawyers.referrals"   → Referral[]
 */

import { prisma } from "@/lib/prisma/client";

export type ReferralStatus =
  | "matched"
  | "contacted"
  | "engaged"
  | "closed_won"
  | "closed_lost";

export interface PartnerLawyer {
  id: string;
  name: string;
  firm: string;
  specialties: string[];
  location: string;
  contact: {
    phone?: string;
    email?: string;
  };
  commissionRate: number; // 0-1, e.g. 0.15 for 15%
  active: boolean;
  notes?: string;
}

export interface Referral {
  id: string;
  caseId: string;
  caseCategory: string;
  urgency: "low" | "normal" | "high" | "critical";
  location?: string;
  lawyerId: string;
  status: ReferralStatus;
  estimatedFeeKrw?: number;
  commissionKrw?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

const PARTNERS_KEY = "lawyers.partners";
const REFERRALS_KEY = "lawyers.referrals";

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (!row || !row.value) return fallback;
  try { return JSON.parse(row.value) as T; } catch { return fallback; }
}
async function writeJson(key: string, v: unknown): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(v) },
    update: { value: JSON.stringify(v) },
  });
}
function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- Partner CRUD ---
export async function listPartners(): Promise<PartnerLawyer[]> {
  return readJson<PartnerLawyer[]>(PARTNERS_KEY, []);
}
export async function getPartner(id: string): Promise<PartnerLawyer | null> {
  const all = await listPartners();
  return all.find((p) => p.id === id) ?? null;
}
export async function upsertPartner(partner: Omit<PartnerLawyer, "id"> & { id?: string }): Promise<PartnerLawyer> {
  const all = await listPartners();
  const id = partner.id ?? genId("law");
  const record: PartnerLawyer = { ...partner, id };
  const idx = all.findIndex((p) => p.id === id);
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  await writeJson(PARTNERS_KEY, all);
  return record;
}
export async function deletePartner(id: string): Promise<void> {
  const all = await listPartners();
  await writeJson(PARTNERS_KEY, all.filter((p) => p.id !== id));
}

// --- Matching ---
export async function matchLawyerForCase(
  caseCategory: string,
  urgency: "low" | "normal" | "high" | "critical",
  location?: string
): Promise<PartnerLawyer[]> {
  const partners = (await listPartners()).filter((p) => p.active);
  const cat = caseCategory.toLowerCase();
  const loc = (location ?? "").toLowerCase();
  const scored = partners.map((p) => {
    let score = 0;
    if (p.specialties.some((s) => s.toLowerCase().includes(cat) || cat.includes(s.toLowerCase()))) score += 3;
    if (loc && p.location.toLowerCase().includes(loc)) score += 2;
    // Prefer lower commission for high-urgency (faster fit)
    if (urgency === "critical" || urgency === "high") score += (1 - p.commissionRate);
    return { p, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.p);
}

// --- Referrals ---
export async function listReferrals(filter?: { caseId?: string; status?: ReferralStatus }): Promise<Referral[]> {
  const all = await readJson<Referral[]>(REFERRALS_KEY, []);
  return all.filter((r) => {
    if (filter?.caseId && r.caseId !== filter.caseId) return false;
    if (filter?.status && r.status !== filter.status) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReferral(input: {
  caseId: string;
  caseCategory: string;
  urgency: "low" | "normal" | "high" | "critical";
  location?: string;
  lawyerId: string;
  estimatedFeeKrw?: number;
  notes?: string;
}): Promise<Referral> {
  const all = await readJson<Referral[]>(REFERRALS_KEY, []);
  const now = new Date().toISOString();
  const partner = await getPartner(input.lawyerId);
  const commissionKrw = partner && input.estimatedFeeKrw
    ? Math.round(input.estimatedFeeKrw * partner.commissionRate)
    : undefined;
  const record: Referral = {
    id: genId("ref"),
    caseId: input.caseId,
    caseCategory: input.caseCategory,
    urgency: input.urgency,
    location: input.location,
    lawyerId: input.lawyerId,
    status: "matched",
    estimatedFeeKrw: input.estimatedFeeKrw,
    commissionKrw,
    createdAt: now,
    updatedAt: now,
    notes: input.notes,
  };
  all.push(record);
  await writeJson(REFERRALS_KEY, all);
  return record;
}

export async function updateReferral(
  id: string,
  patch: Partial<Pick<Referral, "status" | "estimatedFeeKrw" | "commissionKrw" | "notes">>
): Promise<Referral | null> {
  const all = await readJson<Referral[]>(REFERRALS_KEY, []);
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  await writeJson(REFERRALS_KEY, all);
  return all[idx];
}

export async function totalCommissions(): Promise<number> {
  const all = await readJson<Referral[]>(REFERRALS_KEY, []);
  return all
    .filter((r) => r.status === "closed_won")
    .reduce((sum, r) => sum + (r.commissionKrw ?? 0), 0);
}
