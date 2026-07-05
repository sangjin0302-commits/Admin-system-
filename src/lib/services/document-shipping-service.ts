/**
 * 국제 배송 서비스 (DHL/FedEx). Manual-quote fallback while API keys are pending.
 * Storage: SiteSetting "shipping.requests" → ShippingRequest[]
 */

import { prisma } from "@/lib/prisma/client";

export type ShippingService = "standard" | "express";
export type ShippingCarrier = "dhl" | "fedex" | "ems";
export type ShippingStatus =
  | "requested"
  | "quoted"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface ShippingAddress {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string; // ISO2
  phone?: string;
  email?: string;
}

export interface ShippingRequest {
  id: string;
  userId: string;
  caseId?: string;
  documents: string[];         // file names / descriptions
  destination: ShippingAddress;
  service: ShippingService;
  carrier?: ShippingCarrier;
  costKrw: number;
  status: ShippingStatus;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

const KEY = "shipping.requests";

async function readAll(): Promise<ShippingRequest[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: KEY } }).catch(() => null);
  if (!row || !row.value) return [];
  try { return JSON.parse(row.value) as ShippingRequest[]; } catch { return []; }
}

async function writeAll(v: ShippingRequest[]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(v) },
    update: { value: JSON.stringify(v) },
  });
}

function genId(): string {
  return `ship_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Rough cost estimate (KRW) — used before manual admin quote. */
export function estimateShippingCost(
  destination: ShippingAddress,
  service: ShippingService,
  pageCount = 20
): number {
  // Region multiplier (very rough, KRW)
  const asiaCountries = ["JP", "CN", "TW", "HK", "SG", "VN", "TH", "PH", "MY", "ID"];
  const usEu = ["US", "GB", "DE", "FR", "IT", "ES", "NL", "CA"];
  let base = 60_000;
  if (asiaCountries.includes(destination.country.toUpperCase())) base = 45_000;
  else if (usEu.includes(destination.country.toUpperCase())) base = 90_000;
  else base = 120_000;
  const expressMul = service === "express" ? 1.6 : 1.0;
  const pageAdd = Math.max(0, pageCount - 20) * 1_500;
  return Math.round(base * expressMul + pageAdd);
}

export async function listShippingRequests(filter?: { userId?: string; status?: ShippingStatus }): Promise<ShippingRequest[]> {
  const all = await readAll();
  return all.filter((r) => {
    if (filter?.userId && r.userId !== filter.userId) return false;
    if (filter?.status && r.status !== filter.status) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createShippingRequest(input: {
  userId: string;
  caseId?: string;
  documents: string[];
  destination: ShippingAddress;
  service: ShippingService;
  notes?: string;
}): Promise<ShippingRequest> {
  const all = await readAll();
  const now = new Date().toISOString();
  const record: ShippingRequest = {
    id: genId(),
    userId: input.userId,
    caseId: input.caseId,
    documents: input.documents,
    destination: input.destination,
    service: input.service,
    costKrw: estimateShippingCost(input.destination, input.service, input.documents.length * 5),
    status: "requested",
    createdAt: now,
    updatedAt: now,
    notes: input.notes,
  };
  all.push(record);
  await writeAll(all);
  return record;
}

export async function updateShippingRequest(
  id: string,
  patch: Partial<Pick<ShippingRequest, "status" | "trackingNumber" | "carrier" | "costKrw" | "notes">>
): Promise<ShippingRequest | null> {
  const all = await readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  await writeAll(all);
  return all[idx];
}
