import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import { bulkImportNaverBlog } from "@/lib/services/naver-bulk-importer";
import { getSiteSetting } from "@/lib/services/site-settings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const blogId = (await getSiteSetting("naver.blogId")) || "attorney_jean";
  const url = new URL(request.url);
  const max = Number(url.searchParams.get("max") ?? 100);
  const translate = url.searchParams.get("translate") === "1";
  // 게시판별 수입: 네이버 categoryNo + 지정 사이트 카테고리(선택).
  const categoryNo = url.searchParams.get("categoryNo") ?? undefined;
  const categoryLabel = url.searchParams.get("category") ?? undefined;

  const result = await bulkImportNaverBlog({
    blogId,
    maxPosts: max,
    translate,
    categoryNo,
    categoryLabel,
  });

  // 수동 대량수입도 텔레그램 알림(성공/실패). best-effort.
  try {
    const { sendTelegramAlert } = await import("@/lib/services/telegram-notify");
    if (result.imported > 0) {
      await sendTelegramAlert({
        kind: "system",
        title: `블로그 대량수입 완료 (${result.imported}편)`,
        lines: [
          `건너뜀: ${result.skipped} · 번역: ${result.translated}`,
          categoryNo ? `게시판 categoryNo=${categoryNo}` : "전체",
        ],
      });
    }
    if (result.errors.length > 0) {
      await sendTelegramAlert({
        kind: "blog_sync_failed",
        title: `블로그 대량수입 오류 (${result.errors.length}건)`,
        lines: result.errors.slice(0, 3),
      });
    }
  } catch {
    /* best-effort */
  }

  return NextResponse.json({ ok: true, blogId, categoryNo: categoryNo ?? null, ...result });
}
