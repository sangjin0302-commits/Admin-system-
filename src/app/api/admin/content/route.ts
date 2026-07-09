import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { getAllContent } from "@/lib/services/site-content-service";
import { CONTENT_KEYS } from "@/lib/services/site-content-keys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.content.list");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const values = await getAllContent();
    return api.ok({ ok: true, registry: CONTENT_KEYS, values });
  } catch (err) {
    api.logError(err);
    return api.error(500, "콘텐츠 조회 실패", { code: "CONTENT_LIST_FAILED" });
  }
}
