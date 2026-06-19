import { prisma } from "@/lib/prisma/client";

export type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  ownerEmail: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: Date;
  active: boolean;
};

export const DEFAULT_TENANT: Tenant = {
  id: "default",
  name: "ETHOS 행정사사무소",
  subdomain: "ethos",
  ownerEmail: "admin@ethos.com",
  plan: "enterprise",
  createdAt: new Date(),
  active: true,
};

const tenants = new Map<string, Tenant>();
tenants.set(DEFAULT_TENANT.id, DEFAULT_TENANT);

function generateId(): string {
  return `tenant_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createTenant(
  t: Omit<Tenant, "id" | "createdAt" | "active">
): Tenant {
  const tenant: Tenant = {
    ...t,
    id: generateId(),
    createdAt: new Date(),
    active: true,
  };
  tenants.set(tenant.id, tenant);
  return tenant;
}

export function getTenantBySubdomain(subdomain: string): Tenant | null {
  for (const t of tenants.values()) {
    if (t.subdomain === subdomain) return t;
  }
  return null;
}

export function getTenantById(id: string): Tenant | null {
  return tenants.get(id) ?? null;
}

export function listTenants(): Tenant[] {
  return Array.from(tenants.values());
}

export async function getTenantStats(
  id: string
): Promise<{ inquiries: number; cases: number; revenue: number }> {
  // NOTE: schema lacks a tenantId column, so this returns global stats.
  const tenant = getTenantById(id);
  if (!tenant) return { inquiries: 0, cases: 0, revenue: 0 };

  let inquiries = 0;
  let cases = 0;
  let revenue = 0;
  try {
    // best-effort; ignore if models don't exist
    inquiries = (await prisma.inquiry?.count?.()) ?? 0;
  } catch {}
  try {
    cases = (await prisma.caseMatter?.count?.()) ?? 0;
  } catch {}
  try {
    const agg = await prisma.caseAccountingMemo.aggregate({ _sum: { paidAmount: true } });
    revenue = Number(agg?._sum?.paidAmount ?? 0);
  } catch {}

  return { inquiries, cases, revenue };
}
