/**
 * POST /api/admin/marketing/shorts/generate → 30초 쇼츠 번들 생성
 * GET  /api/admin/marketing/shorts/generate → 최근 번들 목록
 */

import { requireRole } from "@/lib/services/admin-rbac-service";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { generateShortVideo, listRecentShortVideos } from "@/lib/services/short-video-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function guard(req: Request) {
  const g = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!g.ok) return { error: g.response as Response };
  if (!(await isFeatureEnabled("short_video_gen"))) return { flagOff: true };
  return {};
}

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.marketing.shorts.list");
  const g = await guard(req);
  if ("error" in g) return g.error;
  if (g.flagOff) return api.error(403, "쇼츠 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });
  try {
    const bundles = await listRecentShortVideos();
    return api.ok({ ok: true, bundles });
  } catch (err) {
    api.logError(err);
    return api.error(500, "조회 실패", { code: "GET_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.marketing.shorts.generate");
  const g = await guard(req);
  if ("error" in g) return g.error;
  if (g.flagOff) return api.error(403, "쇼츠 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });

  const body = await safeReadJsonBody(req);
  if (!body.ok) return api.error(400, "잘못된 JSON", { code: "BAD_JSON" });
  const topic = typeof (body.body as { topic?: unknown }).topic === "string"
    ? ((body.body as { topic: string }).topic)
    : undefined;

  try {
    const result = await generateShortVideo({ topic });
    if (!result.ok) return api.error(400, result.reason, { code: result.reason });
    return api.ok({ ok: true, bundle: result.bundle });
  } catch (err) {
    api.logError(err);
    return api.error(500, "생성 실패", { code: "GENERATE_FAILED" });
  }
}
