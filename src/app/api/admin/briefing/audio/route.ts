/**
 * GET  /api/admin/briefing/audio?date=YYYY-MM-DD  → 기록 또는 신규 생성
 * POST /api/admin/briefing/audio                    → 오늘자 재생성
 */

import { requireRole } from "@/lib/services/admin-rbac-service";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  briefingTodayKst,
  generateBriefing,
  getBriefingRecord,
  listRecentBriefings,
} from "@/lib/services/audio-briefing-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.briefing.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("audio_briefing"))) {
    return api.error(403, "오디오 브리핑이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date")?.trim() || briefingTodayKst();
  const wantList = url.searchParams.get("list") === "1";

  try {
    if (wantList) {
      const items = await listRecentBriefings(7);
      return api.ok({ ok: true, items });
    }
    let record = await getBriefingRecord(date);
    if (!record && date === briefingTodayKst()) {
      record = await generateBriefing(date, false);
    }
    return api.ok({ ok: true, record });
  } catch (err) {
    api.logError(err);
    return api.error(500, "브리핑 조회 실패", { code: "GET_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.briefing.regenerate");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("audio_briefing"))) {
    return api.error(403, "오디오 브리핑이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });
  }

  try {
    const record = await generateBriefing(undefined, true);
    return api.ok({ ok: true, record });
  } catch (err) {
    api.logError(err);
    return api.error(500, "재생성 실패", { code: "REGEN_FAILED" });
  }
}
