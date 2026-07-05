import { z } from "zod";

import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  decideAction,
  bulkApprove,
  setTrustScore,
  getTrustScore,
} from "@/lib/services/ai-standby-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Schema = z.union([
  z.object({
    actionId: z.string().min(1),
    decision: z.enum(["approve", "rollback", "ignore"]),
  }),
  z.object({ bulk: z.literal("approve_all") }),
  z.object({ trustScore: z.number().min(0).max(1) }),
]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.ai-standby.action");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = Schema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    const d = validation.data;
    if ("actionId" in d) {
      const result = await decideAction(d.actionId, d.decision, guard.user.email);
      if (!result.ok) return api.error(404, "액션을 찾을 수 없음", { code: "NOT_FOUND" });
      return api.ok({ ok: true, action: result.action });
    }
    if ("bulk" in d) {
      const count = await bulkApprove();
      return api.ok({ ok: true, approved: count });
    }
    if ("trustScore" in d) {
      await setTrustScore(d.trustScore);
      return api.ok({ ok: true, trustScore: await getTrustScore() });
    }
    return api.error(400, "지원하지 않는 액션", { code: "INVALID_ACTION" });
  } catch (err) {
    api.logError(err);
    return api.error(500, "액션 실패", { code: "AI_STANDBY_ACTION_FAILED" });
  }
}
