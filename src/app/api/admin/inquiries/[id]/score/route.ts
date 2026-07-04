import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { getStoredScore, scoreInquiry } from "@/lib/services/priority-scoring-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.inquiry.score.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  try {
    const score = await getStoredScore(id);
    return api.ok({ ok: true, score });
  } catch (err) {
    api.logError(err);
    return api.error(500, "우선순위 점수 조회 실패", { code: "SCORE_GET_FAILED" });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.inquiry.score.compute");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  try {
    const score = await scoreInquiry(id);
    return api.ok({ ok: true, score });
  } catch (err) {
    api.logError(err);
    return api.error(500, "우선순위 점수 계산 실패", { code: "SCORE_COMPUTE_FAILED" });
  }
}
