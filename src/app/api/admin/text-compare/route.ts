import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { compareTextsAB, type TextABContext } from "@/lib/services/text-ab-comparator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.text-compare");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const body = await safeReadJsonBody(req);
  if (!body.ok) return api.error(400, "요청 본문을 읽을 수 없습니다.", { code: "INVALID_BODY" });

  const payload = body.body as { textA?: unknown; textB?: unknown; context?: unknown };
  const textA = typeof payload.textA === "string" ? payload.textA : "";
  const textB = typeof payload.textB === "string" ? payload.textB : "";
  if (!textA.trim() || !textB.trim()) {
    return api.error(400, "두 문안을 모두 입력해 주세요.", { code: "EMPTY_TEXTS" });
  }

  let context: TextABContext = {};
  if (payload.context && typeof payload.context === "object") {
    const c = payload.context as Record<string, unknown>;
    const audience = c.audience;
    if (audience === "client" || audience === "court" || audience === "internal" || audience === "public") {
      context.audience = audience;
    }
    if (typeof c.purpose === "string") context.purpose = c.purpose;
  }

  try {
    const result = await compareTextsAB(textA, textB, context);
    return api.ok({ ok: true, result });
  } catch (err) {
    api.logError(err);
    return api.error(500, "문안 비교 실패", { code: "TEXT_COMPARE_FAILED" });
  }
}
