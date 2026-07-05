/**
 * POST /api/admin/marketing/instagram/generate → 카드뉴스 번들 생성
 * GET  /api/admin/marketing/instagram/generate → 최근 번들 목록
 */

import { requireRole } from "@/lib/services/admin-rbac-service";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  generateInstagramCards,
  listRecentInstagramBundles,
} from "@/lib/services/instagram-card-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function guard(req: Request) {
  const g = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!g.ok) return { error: g.response as Response };
  if (!(await isFeatureEnabled("instagram_cards"))) return { flagOff: true };
  return {};
}

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.marketing.instagram.list");
  const g = await guard(req);
  if ("error" in g) return g.error;
  if (g.flagOff) return api.error(403, "인스타 카드 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });
  try {
    const bundles = await listRecentInstagramBundles();
    return api.ok({ ok: true, bundles });
  } catch (err) {
    api.logError(err);
    return api.error(500, "조회 실패", { code: "GET_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.marketing.instagram.generate");
  const g = await guard(req);
  if ("error" in g) return g.error;
  if (g.flagOff) return api.error(403, "인스타 카드 기능이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });

  const body = await safeReadJsonBody(req);
  if (!body.ok) return api.error(400, "잘못된 JSON", { code: "BAD_JSON" });
  const b = body.body as { sourceType?: unknown; sourceId?: unknown; customText?: unknown };
  const sourceType = b.sourceType;
  if (sourceType !== "precedent" && sourceType !== "blog" && sourceType !== "news" && sourceType !== "custom") {
    return api.error(400, "sourceType 필수", { code: "BAD_SOURCE_TYPE" });
  }

  try {
    const result = await generateInstagramCards({
      sourceType,
      sourceId: typeof b.sourceId === "string" ? b.sourceId : undefined,
      customText: typeof b.customText === "string" ? b.customText : undefined,
    });
    if (!result.ok) {
      const status = result.reason === "SOURCE_NOT_FOUND" ? 404 : 400;
      return api.error(status, result.reason, { code: result.reason });
    }
    return api.ok({ ok: true, bundle: result.bundle });
  } catch (err) {
    api.logError(err);
    return api.error(500, "생성 실패", { code: "GENERATE_FAILED" });
  }
}
