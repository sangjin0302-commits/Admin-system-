/**
 * III8 — 멀티 사무소 지원 준비 (orgId scaffolding).
 *
 * 이 모듈은 현재 orgId 처리의 **입구/출구만** 담당합니다.
 * multi_org_mode 플래그가 꺼져 있으면 항상 "default" orgId를 반환하며,
 * 기존 쿼리에는 아직 orgId 필터를 강제 적용하지 않습니다 (점진 도입 예정).
 */

import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const DEFAULT_ORG_ID = "default";
const ORG_HEADER = "x-org-id";

type MaybeRequest = Request | { headers: { get(name: string): string | null } } | null | undefined;

/** 현재 요청의 orgId 확정.
 * 우선순위: multi_org_mode 활성 시 → 헤더(x-org-id) → env(DEFAULT_ORG_ID) → "default".
 * 비활성 시 → 항상 "default".
 */
export async function getCurrentOrgId(request?: MaybeRequest): Promise<string> {
  const enabled = await isFeatureEnabled("multi_org_mode");
  if (!enabled) return DEFAULT_ORG_ID;

  const headerVal = request?.headers?.get?.(ORG_HEADER);
  if (headerVal && headerVal.trim().length > 0) return headerVal.trim();

  const envVal = process.env.DEFAULT_ORG_ID;
  if (envVal && envVal.trim().length > 0) return envVal.trim();

  return DEFAULT_ORG_ID;
}

/** Prisma where clause에 orgId 필터를 추가한다.
 * 플래그가 꺼져있으면 clause를 그대로 반환하고, 켜져있으면 orgId를 얹는다.
 */
export function withOrgFilter<T extends Record<string, unknown>>(
  where: T | undefined,
  orgId: string
): T & { orgId?: string } {
  const base = (where ?? {}) as T;
  if (!orgId || orgId === DEFAULT_ORG_ID) return base;
  return { ...base, orgId } as T & { orgId: string };
}

/** SiteSetting에 등록된 모든 org ID 목록 반환 */
export async function getAvailableOrgs(): Promise<string[]> {
  const { prisma } = await import("@/lib/prisma/client");
  const rows = await prisma.siteSetting.findMany({
    where: { key: { startsWith: "org." } },
    select: { key: true },
  });
  return rows.map((r) => r.key.slice("org.".length));
}

export const ORG_DEFAULT_ID = DEFAULT_ORG_ID;
