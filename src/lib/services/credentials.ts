/**
 * 대표 경력/자격/학력 (about 페이지 연혁 + 관리자 편집).
 * DB 있으면 DB, 없으면 기본 연혁 fallback.
 */

import { prisma } from "@/lib/prisma/client";

export const CREDENTIAL_TYPE_LABELS: Record<string, string> = {
  CAREER: "경력",
  LICENSE: "자격",
  EDUCATION: "학력",
  AWARD: "수상",
  ACTIVITY: "활동"
};

export type PublicCredential = {
  type: string;
  year: string;
  title: string;
  detail: string;
};

// 연혁 기본값. 자격 취득(2025) 이전에 "행정심판·인허가 업무 확장"이 오면
// 시간순이 맞지 않아 정리했다. 실제 값은 /admin/credentials 에서 편집한다.
const DEFAULTS: readonly PublicCredential[] = [
  { type: "CAREER", year: "2022", title: "주한 대사관 비자·출입국 실무", detail: "" },
  { type: "LICENSE", year: "2025", title: "행정사 자격 취득", detail: "" },
  { type: "CAREER", year: "2026", title: "에토스 행정사사무소 개업", detail: "" }
];

export async function listPublicCredentials(): Promise<PublicCredential[]> {
  try {
    const rows = await prisma.credential.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { year: "asc" }]
    });
    if (rows.length > 0) {
      return rows.map((r) => ({ type: r.type, year: r.year, title: r.title, detail: r.detail }));
    }
  } catch {
    /* table missing → defaults */
  }
  return [...DEFAULTS];
}

export async function listAdminCredentials() {
  try {
    return await prisma.credential.findMany({
      orderBy: [{ sortOrder: "asc" }, { year: "asc" }]
    });
  } catch {
    return [];
  }
}
