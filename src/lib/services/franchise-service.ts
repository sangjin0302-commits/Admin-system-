/**
 * 프랜차이즈 SaaS — 다른 행정사무소에 ETHOS 시스템을 판매.
 * Storage: SiteSetting "franchise.list" (JSON array).
 * 실제 멀티테넌트 DB 분리는 미래 작업 — 현재는 franchiseId 네임스페이스 표시만.
 */

import { prisma } from "@/lib/prisma/client";
import { FRANCHISE_PLANS, type Franchise, type FranchisePlan, type FranchiseStatus } from "./franchise-types";

export { FRANCHISE_PLANS } from "./franchise-types";
export type { Franchise, FranchisePlan, FranchiseStatus } from "./franchise-types";

const LIST_KEY = "franchise.list";

function newId(): string {
  return `frn_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readList(): Promise<Franchise[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: LIST_KEY } }).catch(() => null);
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as Franchise[]) : [];
  } catch {
    return [];
  }
}

async function writeList(list: Franchise[]): Promise<void> {
  const value = JSON.stringify(list);
  await prisma.siteSetting.upsert({
    where: { key: LIST_KEY },
    create: { key: LIST_KEY, value },
    update: { value },
  });
}

export async function listFranchises(status?: FranchiseStatus): Promise<Franchise[]> {
  const all = await readList();
  return status ? all.filter((f) => f.status === status) : all;
}

export async function getFranchise(id: string): Promise<Franchise | null> {
  const all = await readList();
  return all.find((f) => f.id === id) ?? null;
}

export async function applyFranchise(input: {
  orgName: string;
  adminEmail: string;
  contactName?: string;
  plan: FranchisePlan;
  estimatedCases?: number;
  note?: string;
}): Promise<Franchise> {
  const all = await readList();
  const item: Franchise = {
    id: newId(),
    orgName: input.orgName,
    adminEmail: input.adminEmail,
    contactName: input.contactName,
    plan: input.plan,
    subdomain: input.orgName.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 20) || `office${Date.now()}`,
    status: "pending",
    monthlyFee: FRANCHISE_PLANS[input.plan].monthlyFee,
    estimatedCases: input.estimatedCases,
    note: input.note,
    createdAt: new Date().toISOString(),
  };
  all.push(item);
  await writeList(all);
  return item;
}

export async function provisionFranchise(
  id: string,
  overrides: Partial<Pick<Franchise, "subdomain" | "brandColors" | "brandLogo">>
): Promise<Franchise | null> {
  const all = await readList();
  const idx = all.findIndex((f) => f.id === id);
  if (idx < 0) return null;
  all[idx] = {
    ...all[idx],
    ...overrides,
    status: "active",
    activatedAt: new Date().toISOString(),
  };
  await writeList(all);
  return all[idx];
}

export async function updateFranchiseStatus(id: string, status: FranchiseStatus): Promise<Franchise | null> {
  const all = await readList();
  const idx = all.findIndex((f) => f.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status };
  await writeList(all);
  return all[idx];
}

/** 향후 데이터 쿼리에 붙일 네임스페이스 프리픽스. */
export function franchiseNamespace(franchiseId: string, key: string): string {
  return `franchise:${franchiseId}:${key}`;
}
