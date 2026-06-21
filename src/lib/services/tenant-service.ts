/**
 * Tenant (Organization) service — 멀티사무소 확장을 위한 기반.
 *
 * 현재는 in-memory + 환경변수 시드 방식으로 동작합니다 (단일 사무소 운영).
 * Prisma에 Organization 모델을 추가하기 전까지의 가벼운 추상화 레이어.
 *
 * 향후 마이그레이션:
 *   1) Prisma `model Organization` 추가, 주요 모델에 nullable `orgId` 컬럼 추가
 *   2) `getCurrentOrgId()` 를 NextAuth 세션/요청 헤더로부터 읽도록 교체
 *   3) `withOrgScope(query)` 헬퍼로 모든 prisma find/where 에 orgId 주입
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
  ownerEmail: process.env.TENANT_DEFAULT_OWNER?.trim() || "admin@ethos.kr",
  plan: (process.env.TENANT_DEFAULT_PLAN?.trim() as TenantPlan) || "enterprise",
  createdAt: new Date(),
  active: true,
};

const tenants = new Map<string, Tenant>();
tenants.set(DEFAULT_TENANT.id, DEFAULT_TENANT);

/**
 * 보조 환경변수로 사무소를 추가 등록.
 *   TENANT_<ID>_NAME, TENANT_<ID>_SUBDOMAIN, TENANT_<ID>_OWNER, TENANT_<ID>_PLAN
 */
function loadAdditionalTenantsFromEnv(): void {
  const tenantIds = new Set<string>();
  for (const key of Object.keys(process.env)) {
    const m = key.match(/^TENANT_([A-Z0-9_]+)_NAME$/);
    if (m && m[1] !== "DEFAULT") tenantIds.add(m[1]);
  }
  for (const rawId of tenantIds) {
    const id = rawId.toLowerCase();
    if (tenants.has(id)) continue;
    const name = process.env[`TENANT_${rawId}_NAME`]?.trim();
    const subdomain = process.env[`TENANT_${rawId}_SUBDOMAIN`]?.trim();
    const ownerEmail = process.env[`TENANT_${rawId}_OWNER`]?.trim();
    if (!name || !subdomain || !ownerEmail) continue;
    tenants.set(id, {
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

// ---------------------------------------------------------------------------
// Tenant context (현재 요청의 사무소 ID)
// ---------------------------------------------------------------------------

/**
 * 현재 요청의 사무소 ID를 결정.
 *  1) 명시적 헤더 `x-tenant-id` (내부 호출용)
 *  2) Host의 서브도메인 (e.g. `ethos.example.com` → `ethos`)
 *  3) 기본값 DEFAULT_TENANT_ID
 */
export function resolveTenantId(req?: { headers: Headers }): string {
  if (!req) return DEFAULT_TENANT_ID;
  const explicit = req.headers.get("x-tenant-id")?.trim();
  if (explicit && tenants.has(explicit)) return explicit;
  const host = req.headers.get("host") ?? "";
  const sub = host.split(".")[0]?.toLowerCase();
  if (sub) {
    const t = getTenantBySubdomain(sub);
    if (t) return t.id;
  }
  return DEFAULT_TENANT_ID;
}

/**
 * Prisma where 절에 orgId를 주입하는 헬퍼.
 * Organization 컬럼이 아직 없으므로 단일사무소 환경에서는 항상 그대로 반환.
 * Organization 컬럼 도입 후엔 `{ ...where, orgId }` 로 교체.
 */
export function withTenantScope<T extends Record<string, unknown>>(
  where: T,
  _tenantId: string = DEFAULT_TENANT_ID
): T {
  return where;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getTenantStats(
  id: string
): Promise<{ inquiries: number; cases: number; revenue: number }> {
  const tenant = getTenantById(id);
  if (!tenant) return { inquiries: 0, cases: 0, revenue: 0 };

  let inquiries = 0;
  let cases = 0;
  let revenue = 0;
  try {
    inquiries = await prisma.inquiry.count();
  } catch {}
  try {
    cases = await prisma.caseMatter.count();
  } catch {}
  try {
    const agg = await prisma.caseAccountingMemo.aggregate({
      _sum: { paidAmount: true },
    });
    revenue = Number(agg?._sum?.paidAmount ?? 0);
  } catch {}

  return { inquiries, cases, revenue };
}
