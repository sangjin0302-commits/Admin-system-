/**
 * GET  /api/admin/marketing/podcast → 에피소드 목록
 * POST /api/admin/marketing/podcast → 이번주 에피소드 생성 (수동)
 */

import { requireRole } from "@/lib/services/admin-rbac-service";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { generateWeeklyEpisode, listEpisodes } from "@/lib/services/podcast-generator-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function guard(req: Request) {
  const g = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!g.ok) return { error: g.response as Response };
  if (!(await isFeatureEnabled("podcast_series"))) return { flagOff: true };
  return {};
}

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.marketing.podcast.get");
  const g = await guard(req);
  if ("error" in g) return g.error;
  if (g.flagOff) return api.error(403, "팟캐스트 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });
  try {
    const episodes = await listEpisodes();
    return api.ok({ ok: true, episodes });
  } catch (err) {
    api.logError(err);
    return api.error(500, "조회 실패", { code: "GET_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.marketing.podcast.generate");
  const g = await guard(req);
  if ("error" in g) return g.error;
  if (g.flagOff) return api.error(403, "팟캐스트 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });
  try {
    const result = await generateWeeklyEpisode({ force: true });
    if (!result.ok) return api.error(503, result.reason, { code: result.reason });
    return api.ok({ ok: true, episode: result.episode, created: result.created });
  } catch (err) {
    api.logError(err);
    return api.error(500, "생성 실패", { code: "GENERATE_FAILED" });
  }
}
