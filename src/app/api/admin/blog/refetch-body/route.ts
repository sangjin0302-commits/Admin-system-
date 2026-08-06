import { NextResponse } from "next/server";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { fetchNaverPostBody } from "@/lib/services/naver-rss-importer";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";
import { logger } from "@/lib/utils/logger";

/**
 * 네이버 블로그 링크 → 본문 전문 HTML 을 스크레이프해 반환(저장 안 함).
 *
 * 목적: 수입 시 스크레이프 실패로 요약만 저장된 글을, 관리자가 에디터에서 링크를
 * 붙여 넣고 "본문 가져오기" 로 다시 채우게 한다. 반환된 HTML 을 에디터 body 에 넣고
 * 사람이 확인 후 저장 → 네이버 봇차단으로 실패해도 그 자리서 수동 붙여넣기로 폴백.
 */
export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  let link = "";
  try {
    const data = await request.json();
    link = typeof data?.link === "string" ? data.link.trim() : "";
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  if (!/^https?:\/\/(m\.)?blog\.naver\.com\//i.test(link)) {
    return NextResponse.json(
      { error: "네이버 블로그 링크(https://blog.naver.com/...)를 입력해 주세요." },
      { status: 400 },
    );
  }

  try {
    const html = await fetchNaverPostBody(link);
    if (!html) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "본문을 가져오지 못했습니다(네이버 차단/비공개/형식). 원문에서 직접 복사해 붙여 넣어 주세요.",
        },
        { status: 200 },
      );
    }
    // 에디터로 그대로 들어가므로 서버에서 한 번 정화(script/iframe 등 제거).
    const safe = sanitizeHtml(html);
    return NextResponse.json({ ok: true, html: safe, length: safe.length });
  } catch (err) {
    logger.warn("[blog-refetch-body] 실패", err);
    return NextResponse.json({ ok: false, error: "가져오기 중 오류가 발생했습니다." }, { status: 200 });
  }
}
