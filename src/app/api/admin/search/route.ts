import { NextRequest, NextResponse } from "next/server";
import { searchAdminEverything } from "@/lib/services/admin-search-service";

export const dynamic = "force-dynamic";

/**
 * 관리자 통합 검색.
 *
 * 화면(/admin/search)과 상단 검색바가 기대하는 형태로 응답한다:
 *   { ok: true, inquiries: [...], cases: [...], caseStudies: [...] }
 *
 * 예전에는 `{results}` 만 반환해 화면의 `d.ok` 검사가 항상 실패했고,
 * 결과가 몇 건이든 "0건 발견"으로 보였다.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const { inquiries, cases, caseStudies } = await searchAdminEverything(q);
  return NextResponse.json({
    ok: true,
    inquiries,
    cases,
    caseStudies,
    // 이전 형태를 읽던 호출부를 위한 하위 호환 필드.
    results: inquiries,
  });
}
