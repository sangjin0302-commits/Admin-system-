import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getStoredOutcomePrediction,
  predictCaseOutcome,
} from "@/lib/services/case-outcome-predictor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case.outcome.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  try {
    const prediction = await getStoredOutcomePrediction(id);
    return api.ok({ ok: true, prediction });
  } catch (err) {
    api.logError(err);
    return api.error(500, "예측 조회 실패", { code: "OUTCOME_GET_FAILED" });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case.outcome.compute");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  try {
    const prediction = await predictCaseOutcome(id);
    return api.ok({ ok: true, prediction });
  } catch (err) {
    api.logError(err);
    return api.error(500, "예측 계산 실패", { code: "OUTCOME_COMPUTE_FAILED" });
  }
}
