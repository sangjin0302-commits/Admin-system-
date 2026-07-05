/**
 * GET  /api/admin/marketing/naver-kin           → 큐 + 피드 목록
 * POST /api/admin/marketing/naver-kin           → 스캔 실행 (수동 트리거)
 * PATCH /api/admin/marketing/naver-kin?id=xxx   → 큐 아이템 상태/초안 갱신
 * PUT  /api/admin/marketing/naver-kin?type=feeds → 구독 피드 URL 목록 저장
 */

import { requireRole } from "@/lib/services/admin-rbac-service";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  getFeeds,
  getQueue,
  scanFeeds,
  setFeeds,
  updateQueueItem,
  type KinQueueStatus,
} from "@/lib/services/naver-kin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function checkAccess(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return { error: guard.response as Response };
  if (!(await isFeatureEnabled("naver_kin_auto_answer"))) {
    return { flagOff: true };
  }
  return {};
}

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.marketing.naver-kin.get");
  const access = await checkAccess(req);
  if ("error" in access) return access.error;
  if (access.flagOff) return api.error(403, "네이버 지식iN 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });

  try {
    const [queue, feeds] = await Promise.all([getQueue(), getFeeds()]);
    return api.ok({ ok: true, queue, feeds });
  } catch (err) {
    api.logError(err);
    return api.error(500, "조회 실패", { code: "GET_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.marketing.naver-kin.scan");
  const access = await checkAccess(req);
  if ("error" in access) return access.error;
  if (access.flagOff) return api.error(403, "네이버 지식iN 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });

  try {
    const result = await scanFeeds();
    return api.ok({ ok: true, result });
  } catch (err) {
    api.logError(err);
    return api.error(500, "스캔 실패", { code: "SCAN_FAILED" });
  }
}

export async function PATCH(req: Request) {
  const api = createAdminRequestContext("admin.marketing.naver-kin.patch");
  const access = await checkAccess(req);
  if ("error" in access) return access.error;
  if (access.flagOff) return api.error(403, "네이버 지식iN 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return api.error(400, "id 필수", { code: "MISSING_ID" });

  const body = await safeReadJsonBody(req);
  if (!body.ok) return api.error(400, "잘못된 JSON", { code: "BAD_JSON" });
  const b = body.body as { draft?: unknown; status?: unknown };
  const patch: { draft?: string; status?: KinQueueStatus } = {};
  if (typeof b.draft === "string") patch.draft = b.draft;
  if (typeof b.status === "string") {
    const s = b.status;
    if (["PENDING", "APPROVED", "EDITED", "COPIED", "REJECTED"].includes(s)) {
      patch.status = s as KinQueueStatus;
    }
  }

  try {
    const item = await updateQueueItem(id, patch);
    if (!item) return api.error(404, "아이템 없음", { code: "NOT_FOUND" });
    return api.ok({ ok: true, item });
  } catch (err) {
    api.logError(err);
    return api.error(500, "갱신 실패", { code: "PATCH_FAILED" });
  }
}

export async function PUT(req: Request) {
  const api = createAdminRequestContext("admin.marketing.naver-kin.feeds");
  const access = await checkAccess(req);
  if ("error" in access) return access.error;
  if (access.flagOff) return api.error(403, "네이버 지식iN 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });

  const body = await safeReadJsonBody(req);
  if (!body.ok) return api.error(400, "잘못된 JSON", { code: "BAD_JSON" });
  const feeds = (body.body as { feeds?: unknown }).feeds;
  if (!Array.isArray(feeds) || feeds.some((f) => typeof f !== "string")) {
    return api.error(400, "feeds 는 string[] 이어야 합니다.", { code: "BAD_FEEDS" });
  }

  try {
    await setFeeds((feeds as string[]).map((s) => s.trim()).filter(Boolean));
    return api.ok({ ok: true });
  } catch (err) {
    api.logError(err);
    return api.error(500, "저장 실패", { code: "PUT_FAILED" });
  }
}
