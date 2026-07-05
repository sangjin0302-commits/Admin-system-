/**
 * 공증 서비스 파트너 연동.
 * Storage:
 *   "notary.partners"  → NotaryPartner[]
 *   "notary.requests"  → NotaryRequest[]
 */

import { prisma } from "@/lib/prisma/client";

export type NotaryDocType =
  | "power_of_attorney"
  | "affidavit"
  | "translation_certification"
  | "corporate_document"
  | "personal_document"
  | "other";

export type NotaryUrgency = "standard" | "same_day" | "next_day";
export type NotaryDelivery = "pickup" | "domestic_mail" | "international";
export type NotaryStatus = "requested" | "in_progress" | "completed" | "cancelled";

export interface NotaryPartner {
  id: string;
  name: string;
  location: string;
  phone: string;
  email: string;
  specialties: NotaryDocType[];
  active: boolean;
}

export interface NotaryRequest {
  id: string;
  userId: string;
  caseId?: string;
  documentType: NotaryDocType;
  documentTitle: string;
  urgency: NotaryUrgency;
  delivery: NotaryDelivery;
  destinationAddress?: string;
  costKrw: number;
  partnerId?: string;
  status: NotaryStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

const PARTNERS_KEY = "notary.partners";
const REQUESTS_KEY = "notary.requests";

const DEFAULT_PARTNERS: NotaryPartner[] = [
  {
    id: "partner_default_1",
    name: "서울중앙공증사무소",
    location: "서울 중구",
    phone: "02-000-0000",
    email: "partner@example.com",
    specialties: ["power_of_attorney", "affidavit", "translation_certification"],
    active: true,
  },
];

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

export async function listPartners(): Promise<NotaryPartner[]> {
  const stored = await readJson<NotaryPartner[]>(PARTNERS_KEY, []);
  return stored.length ? stored : DEFAULT_PARTNERS;
}

export async function upsertPartner(partner: NotaryPartner): Promise<NotaryPartner> {
  const all = await readJson<NotaryPartner[]>(PARTNERS_KEY, []);
  const idx = all.findIndex((p) => p.id === partner.id);
  if (idx >= 0) all[idx] = partner;
  else all.push(partner);
  await writeJson(PARTNERS_KEY, all);
  return partner;
}

export async function deletePartner(id: string): Promise<void> {
  const all = await readJson<NotaryPartner[]>(PARTNERS_KEY, []);
  await writeJson(PARTNERS_KEY, all.filter((p) => p.id !== id));
}

export function estimateNotaryCost(
  documentType: NotaryDocType,
  urgency: NotaryUrgency,
  delivery: NotaryDelivery
): number {
  const base: Record<NotaryDocType, number> = {
    power_of_attorney: 80_000,
    affidavit: 60_000,
    translation_certification: 50_000,
    corporate_document: 120_000,
    personal_document: 40_000,
    other: 60_000,
  };
  const urgencyMul: Record<NotaryUrgency, number> = {
    standard: 1.0,
    next_day: 1.4,
    same_day: 2.0,
  };
  const deliveryAdd: Record<NotaryDelivery, number> = {
    pickup: 0,
    domestic_mail: 8_000,
    international: 80_000,
  };
  return Math.round(base[documentType] * urgencyMul[urgency] + deliveryAdd[delivery]);
}

export async function listRequests(filter?: { userId?: string; status?: NotaryStatus }): Promise<NotaryRequest[]> {
  const all = await readJson<NotaryRequest[]>(REQUESTS_KEY, []);
  return all.filter((r) => {
    if (filter?.userId && r.userId !== filter.userId) return false;
    if (filter?.status && r.status !== filter.status) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createNotaryRequest(input: {
  userId: string;
  caseId?: string;
  documentType: NotaryDocType;
  documentTitle: string;
  urgency: NotaryUrgency;
  delivery: NotaryDelivery;
  destinationAddress?: string;
  notes?: string;
}): Promise<NotaryRequest> {
  const all = await readJson<NotaryRequest[]>(REQUESTS_KEY, []);
  const now = new Date().toISOString();
  const record: NotaryRequest = {
    id: genId("notary"),
    userId: input.userId,
    caseId: input.caseId,
    documentType: input.documentType,
    documentTitle: input.documentTitle,
    urgency: input.urgency,
    delivery: input.delivery,
    destinationAddress: input.destinationAddress,
    costKrw: estimateNotaryCost(input.documentType, input.urgency, input.delivery),
    status: "requested",
    createdAt: now,
    updatedAt: now,
    notes: input.notes,
  };
  all.push(record);
  await writeJson(REQUESTS_KEY, all);
  return record;
}

export async function updateNotaryRequest(
  id: string,
  patch: Partial<Pick<NotaryRequest, "status" | "partnerId" | "costKrw" | "notes">>
): Promise<NotaryRequest | null> {
  const all = await readJson<NotaryRequest[]>(REQUESTS_KEY, []);
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  await writeJson(REQUESTS_KEY, all);
  return all[idx];
}
