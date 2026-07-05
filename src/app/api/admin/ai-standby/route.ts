import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { getAllActions, getStandbyStats } from "@/lib/services/ai-standby-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.ai-standby.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const [actions, stats] = await Promise.all([getAllActions(100), getStandbyStats()]);
    return api.ok({ ok: true, actions, stats });
  } catch (err) {
    api.logError(err);
    return api.error(500, "AI 대행 조회 실패", { code: "AI_STANDBY_READ_FAILED" });
  }
}
