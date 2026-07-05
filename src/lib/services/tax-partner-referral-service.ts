/**
 * 세무사 연계 — 파트너 세무사 매칭 + 소개 수수료 관리.
 * 저장:
 *   - "tax_partners.list"      → TaxPartner[]
 *   - "tax_partners.referrals" → TaxReferral[]
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const PARTNERS_KEY = "tax_partners.list";
const REFERRALS_KEY = "tax_partners.referrals";

export type TaxSpecialty = "개인" | "법인" | "부가세" | "양도세" | "상속" | "기타";

export type TaxPartner = {
  id: string;
  name: string;
  firm: string;
  specialties: TaxSpecialty[];
  location: string; // 시·군·구
  contactEmail: string;
  contactPhone?: string;
  commissionRate: number; // 0..1
  active: boolean;
  createdAt: string;
  notes?: string;
};

export type TaxReferral = {
  id: string;
  partnerId: string;
  caseId?: string;
  clientName: string;
  taxIssue: string;
  urgency: "low" | "normal" | "high";
  estimatedFee?: number;
  createdAt: string;
  status: "sent" | "accepted" | "completed" | "declined";
  completedAt?: string;
  commissionAmount?: number;
  commissionPaid?: boolean;
};

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    const parsed = JSON.parse(row.value);
    return (parsed as T) ?? fallback;
  } catch (err) {
    logger.warn(`[tax-partner] read ${key} failed`, err);
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

export async function listTaxPartners(): Promise<TaxPartner[]> {
  return readJson<TaxPartner[]>(PARTNERS_KEY, []);
}

export async function addTaxPartner(input: {
  name: string;
  firm: string;
  specialties: TaxSpecialty[];
  location: string;
  contactEmail: string;
  contactPhone?: string;
  commissionRate?: number;
  notes?: string;
}): Promise<TaxPartner> {
  const partners = await listTaxPartners();
  const partner: TaxPartner = {
    id: newId("tax"),
    name: input.name.trim(),
    firm: input.firm.trim(),
    specialties: input.specialties,
    location: input.location.trim(),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    contactPhone: input.contactPhone?.trim(),
    commissionRate: Math.max(0, Math.min(1, input.commissionRate ?? 0.1)),
    active: true,
    createdAt: new Date().toISOString(),
    notes: input.notes?.trim(),
  };
  partners.push(partner);
  await writeJson(PARTNERS_KEY, partners);
  return partner;
}

export async function updateTaxPartner(
  id: string,
  patch: Partial<Omit<TaxPartner, "id" | "createdAt">>
): Promise<TaxPartner | null> {
  const partners = await listTaxPartners();
  const idx = partners.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  partners[idx] = { ...partners[idx], ...patch };
  await writeJson(PARTNERS_KEY, partners);
  return partners[idx];
}

export async function deleteTaxPartner(id: string): Promise<boolean> {
  const partners = await listTaxPartners();
  const filtered = partners.filter((p) => p.id !== id);
  if (filtered.length === partners.length) return false;
  await writeJson(PARTNERS_KEY, filtered);
  return true;
}

const SPECIALTY_KEYWORDS: Array<{ specialty: TaxSpecialty; keywords: string[] }> = [
  { specialty: "법인", keywords: ["법인", "corp", "corporate"] },
  { specialty: "부가세", keywords: ["부가세", "부가가치세", "vat"] },
  { specialty: "양도세", keywords: ["양도", "양도세", "capital gain"] },
  { specialty: "상속", keywords: ["상속", "증여", "inheritance"] },
  { specialty: "개인", keywords: ["개인", "종합소득", "종소세"] },
];

function inferSpecialty(taxIssue: string): TaxSpecialty | null {
  const lower = taxIssue.toLowerCase();
  for (const row of SPECIALTY_KEYWORDS) {
    if (row.keywords.some((k) => lower.includes(k.toLowerCase()))) return row.specialty;
  }
  return null;
}

/**
 * 세무 이슈 + 긴급도 + 지역으로 파트너 매칭. 상위 5명.
 * 매칭 점수: specialty 매칭 +3, 지역 일치 +2, active +1, 수수료 낮을수록 소폭 가점.
 */
export async function matchTaxPartner(
  taxIssue: string,
  urgency: "low" | "normal" | "high",
  location?: string
): Promise<TaxPartner[]> {
  const partners = await listTaxPartners();
  const inferred = inferSpecialty(taxIssue);
  const scored = partners
    .filter((p) => p.active)
    .map((p) => {
      let score = 1; // active
      if (inferred && p.specialties.includes(inferred)) score += 3;
      if (location && p.location && (p.location === location || p.location.includes(location))) score += 2;
      score += (1 - p.commissionRate) * 0.5;
      if (urgency === "high") score += p.specialties.length > 0 ? 0.5 : 0;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.p);
  return scored;
}

export async function listReferrals(): Promise<TaxReferral[]> {
  return readJson<TaxReferral[]>(REFERRALS_KEY, []);
}

export async function createReferral(input: {
  partnerId: string;
  caseId?: string;
  clientName: string;
  taxIssue: string;
  urgency: "low" | "normal" | "high";
  estimatedFee?: number;
}): Promise<TaxReferral> {
  const referrals = await listReferrals();
  const entry: TaxReferral = {
    id: newId("txr"),
    partnerId: input.partnerId,
    caseId: input.caseId,
    clientName: input.clientName.trim(),
    taxIssue: input.taxIssue.trim(),
    urgency: input.urgency,
    estimatedFee: input.estimatedFee,
    createdAt: new Date().toISOString(),
    status: "sent",
  };
  referrals.push(entry);
  await writeJson(REFERRALS_KEY, referrals);
  return entry;
}

export async function completeReferral(
  id: string,
  actualFee: number
): Promise<TaxReferral | null> {
  const referrals = await listReferrals();
  const idx = referrals.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const partners = await listTaxPartners();
  const partner = partners.find((p) => p.id === referrals[idx].partnerId);
  const rate = partner?.commissionRate ?? 0.1;
  referrals[idx] = {
    ...referrals[idx],
    status: "completed",
    completedAt: new Date().toISOString(),
    commissionAmount: Math.round(actualFee * rate),
    commissionPaid: false,
  };
  await writeJson(REFERRALS_KEY, referrals);
  return referrals[idx];
}

export async function markReferralPaid(id: string): Promise<TaxReferral | null> {
  const referrals = await listReferrals();
  const idx = referrals.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  referrals[idx] = { ...referrals[idx], commissionPaid: true };
  await writeJson(REFERRALS_KEY, referrals);
  return referrals[idx];
}

export type TaxPartnerStats = {
  partner: TaxPartner;
  referralCount: number;
  completedCount: number;
  commissionEarned: number;
  commissionUnpaid: number;
};

export async function getTaxPartnerStats(): Promise<TaxPartnerStats[]> {
  const [partners, referrals] = await Promise.all([listTaxPartners(), listReferrals()]);
  return partners.map((p) => {
    const rel = referrals.filter((r) => r.partnerId === p.id);
    const completed = rel.filter((r) => r.status === "completed");
    const earned = completed.reduce((a, r) => a + (r.commissionAmount ?? 0), 0);
    const unpaid = completed
      .filter((r) => !r.commissionPaid)
      .reduce((a, r) => a + (r.commissionAmount ?? 0), 0);
    return {
      partner: p,
      referralCount: rel.length,
      completedCount: completed.length,
      commissionEarned: earned,
      commissionUnpaid: unpaid,
    };
  });
}

const TAX_KEYWORDS = [
  "세금", "세무", "부가세", "양도세", "상속세", "증여", "법인세", "종합소득", "세액", "국세", "홈택스",
];

/** 사건 요약/제목에서 세무 관련 키워드 존재 여부. */
export function caseHasTaxSignal(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return TAX_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}
