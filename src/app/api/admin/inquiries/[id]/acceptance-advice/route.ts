import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  adviseAcceptance,
  getStoredAcceptanceAdvice,
} from "@/lib/services/case-acceptance-advisor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.inquiry.acceptance.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  try {
    const advice = await getStoredAcceptanceAdvice(id);
    return api.ok({ ok: true, advice });
  } catch (err) {
    api.logError(err);
    return api.error(500, "수임 조언 조회 실패", { code: "ACCEPT_GET_FAILED" });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.inquiry.acceptance.compute");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  try {
    const advice = await adviseAcceptance(id);
    return api.ok({ ok: true, advice });
  } catch (err) {
    api.logError(err);
    return api.error(500, "수임 조언 계산 실패", { code: "ACCEPT_COMPUTE_FAILED" });
  }
}
