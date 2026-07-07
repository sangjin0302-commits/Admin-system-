import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  analyzeIncomingMessage,
  getEmotionTrace,
} from "@/lib/services/live-emotion-analyzer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.inquiry.emotion.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  try {
    const trace = await getEmotionTrace(id);
    return api.ok({ ok: true, trace });
  } catch (err) {
    api.logError(err);
    return api.error(500, "감정 추적 조회 실패", { code: "EMOTION_GET_FAILED" });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.inquiry.emotion.analyze");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  const body = await safeReadJsonBody(req);
  if (!body.ok) return api.error(400, "요청 본문을 읽을 수 없습니다.", { code: "INVALID_BODY" });
  const message =
    typeof (body.body as { message?: unknown })?.message === "string"
      ? ((body.body as { message: string }).message)
      : "";
  if (!message.trim()) return api.error(400, "message가 필요합니다.", { code: "EMPTY_MESSAGE" });

  try {
    const trace = await analyzeIncomingMessage(id, message);
    return api.ok({ ok: true, trace });
  } catch (err) {
    api.logError(err);
    return api.error(500, "감정 분석 실패", { code: "EMOTION_ANALYZE_FAILED" });
  }
}
