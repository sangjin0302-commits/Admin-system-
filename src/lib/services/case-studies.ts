/**
 * 사례(처리 사례) 통합 조회.
 * DB(CaseStudy, 관리자 편집) + 기본 하드코딩(PUBLIC_CASES) 병합.
 */

import { prisma } from "@/lib/prisma/client";
import { PUBLIC_CASES, type PublicCase } from "@/lib/public-cases";

export const CASE_CATEGORY_LABELS: Record<string, string> = {
  VISA_STAY: "비자/체류",
  ADMIN_APPEAL: "행정심판",
  CONTRACT_INVESTIGATION: "계약서/사실조사",
  LICENSE_PERMIT: "인허가"
};

export type MergedCase = Pick<
  PublicCase,
  "slug" | "category" | "categoryLabel" | "title" | "summary" | "outcome" | "duration"
> & { source: "db" | "default" };

/** 공개 사례 목록 (DB 우선 노출, 그 뒤 기본 샘플). */
export async function listPublicCaseStudies(): Promise<MergedCase[]> {
  let dbCases: MergedCase[] = [];
  try {
    const rows = await prisma.caseStudy.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });
    dbCases = rows.map((r) => ({
      slug: `db-${r.id}`,
      category: r.category,
      categoryLabel: CASE_CATEGORY_LABELS[r.category] ?? r.category,
      title: r.title,
      summary: r.summary,
      outcome: r.outcome,
      duration: r.duration,
      source: "db" as const
    }));
  } catch {
    dbCases = [];
  }

  const defaults: MergedCase[] = PUBLIC_CASES.map((c) => ({
    slug: c.slug,
    category: c.category,
    categoryLabel: c.categoryLabel,
    title: c.title,
    summary: c.summary,
    outcome: c.outcome,
    duration: c.duration,
    source: "default" as const
  }));

  return [...dbCases, ...defaults];
}

/** 관리자용 — DB 사례 전체 (미게시 포함). */
export async function listAdminCaseStudies() {
  return prisma.caseStudy.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });
}
