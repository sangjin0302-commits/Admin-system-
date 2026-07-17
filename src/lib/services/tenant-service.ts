/**
 * Tenant (Organization) service.
 *
 * DB 우선, env 시드 폴백. Organization 모델이 DB에 있으면 그쪽을 우선 조회하고,
 * 비어있을 땐 환경변수 TENANT_<ID>_* 와 DEFAULT_TENANT 메모리 entry로 동작.
 *
 * 단일 사무소 환경에서는 모든 기존 코드 그대로 동작 (orgId 미지정 = 전역).
 */

import { prisma } from "@/lib/prisma/client";

export type TenantPlan = "free" | "pro" | "enterprise";

export type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  ownerEmail: string;
  plan: TenantPlan;
  createdAt: Date;
  active: boolean;
};

export const DEFAULT_TENANT_ID = "default";

export const DEFAULT_TENANT: Tenant = {
  id: DEFAULT_TENANT_ID,
  name: process.env.TENANT_DEFAULT_NAME?.trim() || "ETHOS 행정사사무소",
  subdomain: process.env.TENANT_DEFAULT_SUBDOMAIN?.trim() || "ethos",
  ownerEmail: process.env.TENANT_DEFAULT_OWNER?.trim() || "admin@ethosattorney.com",
  plan: (process.env.TENANT_DEFAULT_PLAN?.trim() as TenantPlan) || "enterprise",
  createdAt: new Date(),
  active: true,
};

const memoryTenants = new Map<string, Tenant>();
memoryTenants.set(DEFAULT_TENANT.id, DEFAULT_TENANT);

function loadAdditionalTenantsFromEnv(): void {
  const tenantIds = new Set<string>();
  for (const key of Object.keys(process.env)) {
    const m = key.match(/^TENANT_([A-Z0-9_]+)_NAME$/);
    if (m && m[1] !== "DEFAULT") tenantIds.add(m[1]);
  }
  for (const rawId of tenantIds) {
    const id = rawId.toLowerCase();
    if (memoryTenants.has(id)) continue;
    const name = process.env[`TENANT_${rawId}_NAME`]?.trim();
    const subdomain = process.env[`TENANT_${rawId}_SUBDOMAIN`]?.trim();
    const ownerEmail = process.env[`TENANT_${rawId}_OWNER`]?.trim();
    if (!name || !subdomain || !ownerEmail) continue;
    memoryTenants.set(id, {
      id,
      name,
      subdomain,
      ownerEmail,
      plan: (process.env[`TENANT_${rawId}_PLAN`]?.trim() as TenantPlan) || "pro",
      createdAt: new Date(),
      active: true,
    });
  }
}
loadAdditionalTenantsFromEnv();

function dbPlanToTenantPlan(p: string): TenantPlan {
  switch (p) {
    case "FREE":
      return "free";
    case "ENTERPRISE":
      return "enterprise";
    default:
      return "pro";
  }
}

function tenantPlanToDbPlan(p: TenantPlan): "FREE" | "PRO" | "ENTERPRISE" {
  switch (p) {
    case "free":
      return "FREE";
    case "enterprise":
      return "ENTERPRISE";
    default:
      return "PRO";
  }
}

function rowToTenant(row: {
  id: string;
  name: string;
  subdomain: string;
  ownerEmail: string;
  plan: string;
  active: boolean;
  createdAt: Date;
}): Tenant {
  return {
    id: row.id,
    name: row.name,
    subdomain: row.subdomain,
    ownerEmail: row.ownerEmail,
    plan: dbPlanToTenantPlan(row.plan),
    active: row.active,
    createdAt: row.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Public API — DB first, memory fallback
// ---------------------------------------------------------------------------

export async function createTenant(
  t: Omit<Tenant, "id" | "createdAt" | "active">
): Promise<Tenant> {
  try {
    const row = await prisma.organization.create({
      data: {
        name: t.name,
        subdomain: t.subdomain,
        ownerEmail: t.ownerEmail,
        plan: tenantPlanToDbPlan(t.plan),
      },
    });
    return rowToTenant(row);
  } catch {
    const fallback: Tenant = {
      ...t,
      id: `tenant_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
      active: true,
    };
    memoryTenants.set(fallback.id, fallback);
    return fallback;
  }
}

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  try {
    const row = await prisma.organization.findUnique({ where: { subdomain } });
    if (row) return rowToTenant(row);
  } catch {
    // fall through
  }
  for (const t of memoryTenants.values()) if (t.subdomain === subdomain) return t;
  return null;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  try {
    const row = await prisma.organization.findUnique({ where: { id } });
    if (row) return rowToTenant(row);
  } catch {
    // fall through
  }
  return memoryTenants.get(id) ?? null;
}

export async function listTenants(): Promise<Tenant[]> {
  const out: Tenant[] = [];
  try {
    const rows = await prisma.organization.findMany({ orderBy: { createdAt: "asc" } });
    out.push(...rows.map(rowToTenant));
  } catch {
    // ignore
  }
  for (const t of memoryTenants.values()) {
    if (!out.find((o) => o.subdomain === t.subdomain)) out.push(t);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tenant context
// ---------------------------------------------------------------------------

/**
 * 현재 요청의 사무소 ID 결정.
 *  1) 명시적 헤더 `x-tenant-id`
 *  2) Host의 서브도메인
 *  3) 기본값 DEFAULT_TENANT_ID
 *
 * Synchronous — 빠른 경로 결정만 (실제 Tenant 객체는 getTenantById로 별도 조회).
 */
export function resolveTenantId(req?: { headers: Headers }): string {
  if (!req) return DEFAULT_TENANT_ID;
  const explicit = req.headers.get("x-tenant-id")?.trim();
  if (explicit) return explicit;
  const host = req.headers.get("host") ?? "";
  const sub = host.split(".")[0]?.toLowerCase();
  if (sub && sub !== "www" && sub !== "ethos") {
    // 비-default 서브도메인이면 그대로 전달 (DB lookup은 사용처에서)
    return sub;
  }
  return DEFAULT_TENANT_ID;
}

/**
 * Prisma where 절에 orgId 주입.
 * - DEFAULT_TENANT_ID (또는 빈값) → 그대로 반환 (기존 단일사무소 코드 호환)
 * - 다른 tenant id → { ...where, orgId: tenantId }
 *
 * 점진적 도입: 컬럼 추가됐지만 기존 호출자는 그대로 동작.
 */
export function withTenantScope<T extends Record<string, unknown>>(
  where: T,
  tenantId: string = DEFAULT_TENANT_ID
): T {
  if (!tenantId || tenantId === DEFAULT_TENANT_ID) return where;
  return { ...where, orgId: tenantId } as T;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getTenantStats(
  id: string
): Promise<{ inquiries: number; cases: number; revenue: number }> {
  const tenant = await getTenantById(id);
  if (!tenant) return { inquiries: 0, cases: 0, revenue: 0 };

  const scoped = id !== DEFAULT_TENANT_ID;

  let inquiries = 0;
  let cases = 0;
  let revenue = 0;
  try {
    inquiries = await prisma.inquiry.count({
      where: scoped ? { orgId: id } : {},
    });
  } catch {}
  try {
    cases = await prisma.caseMatter.count({
      where: scoped ? { orgId: id } : {},
    });
  } catch {}
  try {
    const agg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMED", ...(scoped ? { orgId: id } : {}) },
    });
    revenue = Number(agg?._sum?.amount ?? 0);
  } catch {
    try {
      const agg = await prisma.caseAccountingMemo.aggregate({
        _sum: { paidAmount: true },
      });
      revenue = Number(agg?._sum?.paidAmount ?? 0);
    } catch {}
  }

  return { inquiries, cases, revenue };
}
