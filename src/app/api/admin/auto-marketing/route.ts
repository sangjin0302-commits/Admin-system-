import { z } from "zod";

import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getDecisions,
  decideMarketing,
  runDecisionCycle,
  getAutoApplyConfig,
  setAutoApplyConfig,
  getTrustThreshold,
  setTrustThreshold,
} from "@/lib/services/auto-marketing-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.auto-marketing.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const [decisions, autoApply, trustThreshold] = await Promise.all([
      getDecisions(100),
      getAutoApplyConfig(),
      getTrustThreshold(),
    ]);
    return api.ok({ ok: true, decisions, autoApply, trustThreshold });
  } catch (err) {
    api.logError(err);
    return api.error(500, "자율 마케팅 조회 실패", { code: "AUTO_MKT_READ_FAILED" });
  }
}

const PostSchema = z.union([
  z.object({ action: z.literal("run_cycle") }),
  z.object({
    action: z.literal("decide"),
    id: z.string().min(1),
    decision: z.enum(["apply", "reject"]),
  }),
  z.object({
    action: z.literal("set_auto_apply"),
    config: z.record(z.string(), z.boolean()),
  }),
  z.object({ action: z.literal("set_trust"), value: z.number().min(0).max(1) }),
]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.auto-marketing.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = PostSchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    const d = validation.data;
    if (d.action === "run_cycle") {
      const result = await runDecisionCycle();
      return api.ok({ ok: true, result });
    }
    if (d.action === "decide") {
      const ok = await decideMarketing(d.id, d.decision, guard.user.email);
      return api.ok({ ok });
    }
    if (d.action === "set_auto_apply") {
      const next = await setAutoApplyConfig(d.config as never);
      return api.ok({ ok: true, autoApply: next });
    }
    if (d.action === "set_trust") {
      await setTrustThreshold(d.value);
      return api.ok({ ok: true, trustThreshold: await getTrustThreshold() });
    }
    return api.error(400, "지원하지 않는 액션", { code: "INVALID_ACTION" });
  } catch (err) {
    api.logError(err);
    return api.error(500, "액션 실패", { code: "AUTO_MKT_ACTION_FAILED" });
  }
}
