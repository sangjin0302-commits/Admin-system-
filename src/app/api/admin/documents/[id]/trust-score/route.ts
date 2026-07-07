import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getStoredTrustScore,
  scoreDocumentTrust,
} from "@/lib/services/evidence-trust-scorer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.document.trust.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  try {
    const score = await getStoredTrustScore(id);
    return api.ok({ ok: true, score });
  } catch (err) {
    api.logError(err);
    return api.error(500, "신뢰도 조회 실패", { code: "TRUST_GET_FAILED" });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.document.trust.compute");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  try {
    const score = await scoreDocumentTrust(id);
    return api.ok({ ok: true, score });
  } catch (err) {
    api.logError(err);
    return api.error(500, "신뢰도 계산 실패", { code: "TRUST_COMPUTE_FAILED" });
  }
}
