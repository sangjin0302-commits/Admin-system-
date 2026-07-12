/**
 * 멀티사무소 (Organization) 관리 서비스.
 *
 * SiteSetting에 key="org.{id}" / value=JSON 형태로 조직 정보를 저장합니다.
 * Organization 전용 Prisma 모델이 추가되면 마이그레이션 예정.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const ORG_KEY_PREFIX = "org.";

export type OrganizationData = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

/** SiteSetting value에서 OrganizationData 파싱 */
function parseOrgSetting(key: string, value: string): OrganizationData | null {
  try {
    const parsed = JSON.parse(value);
    return {
      id: key.slice(ORG_KEY_PREFIX.length),
      name: parsed.name ?? "(이름 없음)",
      description: parsed.description ?? "",
      createdAt: parsed.createdAt ?? new Date().toISOString(),
    };
  } catch {
    logger.warn(`[org-service] failed to parse org setting: ${key}`);
    return null;
  }
}

/** 전체 조직 목록 조회 */
export async function listOrganizations(): Promise<OrganizationData[]> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { startsWith: ORG_KEY_PREFIX } },
    orderBy: { key: "asc" },
  });

  return rows
    .map((r) => parseOrgSetting(r.key, r.value))
    .filter((o): o is OrganizationData => o !== null);
}

/** 단일 조직 조회 */
export async function getOrganization(orgId: string): Promise<OrganizationData | null> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: `${ORG_KEY_PREFIX}${orgId}` },
  });
  if (!row) return null;
  return parseOrgSetting(row.key, row.value);
}

/** 조직 생성 — id는 slugified name 기반 자동 생성 */
export async function createOrganization(data: {
  name: string;
  description?: string;
}): Promise<OrganizationData> {
  const id = data.name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "")
    || `org-${Date.now()}`;

  const orgData: Omit<OrganizationData, "id"> = {
    name: data.name,
    description: data.description ?? "",
    createdAt: new Date().toISOString(),
  };

  await prisma.siteSetting.upsert({
    where: { key: `${ORG_KEY_PREFIX}${id}` },
    create: {
      key: `${ORG_KEY_PREFIX}${id}`,
      value: JSON.stringify(orgData),
    },
    update: {
      value: JSON.stringify(orgData),
    },
  });

  return { id, ...orgData };
}
