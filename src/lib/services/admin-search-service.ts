import { prisma } from "@/lib/prisma/client";

/**
 * 관리자 통합 검색.
 *
 * 예전에는 문의만 검색했고, 라우트는 그 결과를 `{results}` 로 반환했다.
 * 그런데 화면(/admin/search)은 `{ok, cases, inquiries, caseStudies}` 를 기대해서
 * `d.ok` 가 항상 undefined → 어떤 검색어를 넣어도 "0건 발견"만 나왔다.
 * 화면이 이미 3개 그룹을 그리고 있으므로, 서비스 쪽을 화면 계약에 맞춘다.
 */

/** 검색어가 이보다 짧으면 조회하지 않는다(전체 스캔 방지). */
const MIN_QUERY_LENGTH = 2;

export async function searchInquiries(query: string, limit = 20) {
  if (!query || query.length < MIN_QUERY_LENGTH) return [];
  return prisma.inquiry.findMany({
    where: {
      OR: [
        { contactName: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
        { title: { contains: query } },
        { description: { contains: query } },
        { publicTrackingCode: { contains: query } },
      ],
    },
    select: {
      id: true,
      title: true,
      contactName: true,
      email: true,
      phone: true,
      status: true,
      publicTrackingCode: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function searchCaseMatters(query: string, limit = 20) {
  if (!query || query.length < MIN_QUERY_LENGTH) return [];
  return prisma.caseMatter.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { caseNo: { contains: query } },
        { summary: { contains: query } },
      ],
    },
    select: { id: true, caseNo: true, title: true, status: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function searchCaseStudies(query: string, limit = 20) {
  if (!query || query.length < MIN_QUERY_LENGTH) return [];
  return prisma.caseStudy.findMany({
    where: {
      OR: [{ title: { contains: query } }, { summary: { contains: query } }],
    },
    select: { id: true, title: true, category: true, published: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** 화면이 그대로 쓸 수 있는 형태로 3종을 한 번에 조회한다. */
export async function searchAdminEverything(query: string, limit = 20) {
  const [inquiries, cases, caseStudies] = await Promise.all([
    searchInquiries(query, limit),
    searchCaseMatters(query, limit),
    searchCaseStudies(query, limit),
  ]);
  return { inquiries, cases, caseStudies };
}
