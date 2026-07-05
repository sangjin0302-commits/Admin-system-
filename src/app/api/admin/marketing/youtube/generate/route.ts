/**
 * POST /api/admin/marketing/youtube/generate  { blogPostId, force? } → 번들 생성
 * GET  /api/admin/marketing/youtube/generate                          → 대상 블로그 목록
 * GET  /api/admin/marketing/youtube/generate?blogPostId=xxx           → 기존 번들 조회
 */

import { requireRole } from "@/lib/services/admin-rbac-service";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  generateYoutubeBundle,
  getYoutubeBundle,
  listBlogPostsForYoutube,
} from "@/lib/services/youtube-content-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function guard(req: Request) {
  const g = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!g.ok) return { error: g.response as Response };
  if (!(await isFeatureEnabled("youtube_content_gen"))) return { flagOff: true };
  return {};
}

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.marketing.youtube.get");
  const g = await guard(req);
  if ("error" in g) return g.error;
  if (g.flagOff) return api.error(403, "유튜브 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });

  const url = new URL(req.url);
  const blogPostId = url.searchParams.get("blogPostId");
  try {
    if (blogPostId) {
      const bundle = await getYoutubeBundle(blogPostId);
      return api.ok({ ok: true, bundle });
    }
    const posts = await listBlogPostsForYoutube();
    return api.ok({ ok: true, posts });
  } catch (err) {
    api.logError(err);
    return api.error(500, "조회 실패", { code: "GET_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.marketing.youtube.generate");
  const g = await guard(req);
  if ("error" in g) return g.error;
  if (g.flagOff) return api.error(403, "유튜브 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });

  const body = await safeReadJsonBody(req);
  if (!body.ok) return api.error(400, "잘못된 JSON", { code: "BAD_JSON" });
  const b = body.body as { blogPostId?: unknown; force?: unknown };
  if (typeof b.blogPostId !== "string") return api.error(400, "blogPostId 필수", { code: "MISSING_ID" });
  const force = b.force === true;

  try {
    const result = await generateYoutubeBundle(b.blogPostId, { force });
    if (!result.ok) {
      const status = result.reason === "POST_NOT_FOUND" ? 404 : 503;
      return api.error(status, result.reason, { code: result.reason });
    }
    return api.ok({ ok: true, bundle: result.bundle });
  } catch (err) {
    api.logError(err);
    return api.error(500, "생성 실패", { code: "GENERATE_FAILED" });
  }
}
