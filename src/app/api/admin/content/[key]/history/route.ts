import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { getContentHistory } from "@/lib/services/site-content-service";
import { isValidContentKey } from "@/lib/services/site-content-keys";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ key: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const api = createAdminRequestContext("admin.content.history");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF", "AUDITOR"]);
  if (!guard.ok) return guard.response;

  const enabled = await isFeatureEnabled("cms_history").catch(() => true);
  if (!enabled) {
    return api.ok({ ok: true, history: [], disabled: true });
  }

  const { key } = await ctx.params;
  if (!isValidContentKey(key)) {
    return api.error(404, "알 수 없는 콘텐츠 키", { code: "CONTENT_KEY_UNKNOWN" });
  }

  try {
    const history = await getContentHistory(key);
    return api.ok({ ok: true, key, history });
  } catch (err) {
    api.logError(err);
    return api.error(500, "히스토리 조회 실패", { code: "CONTENT_HISTORY_FAILED" });
  }
}
