import { z } from "zod";

import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getHealLog,
  getHealStats,
  updateRecordStatus,
  analyzeAndHeal,
  scanAndHeal,
} from "@/lib/services/self-healing-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.self-healing.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const [log, stats] = await Promise.all([getHealLog(), getHealStats()]);
    return api.ok({ ok: true, log: log.slice(-100).reverse(), stats });
  } catch (err) {
    api.logError(err);
    return api.error(500, "치유 로그 조회 실패", { code: "SELF_HEAL_READ_FAILED" });
  }
}

const ActionSchema = z.object({
  action: z.enum(["scan", "update_status", "analyze"]),
  id: z.string().optional(),
  status: z.enum(["auto_healed", "pending_review", "ignored"]).optional(),
  errorMessage: z.string().optional(),
  errorStack: z.string().optional(),
});

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.self-healing.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = ActionSchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    const d = validation.data;
    if (d.action === "scan") {
      const result = await scanAndHeal();
      return api.ok({ ok: true, result });
    }
    if (d.action === "update_status" && d.id && d.status) {
      const ok = await updateRecordStatus(d.id, d.status);
      return api.ok({ ok });
    }
    if (d.action === "analyze" && d.errorMessage) {
      const result = await analyzeAndHeal({
        message: d.errorMessage,
        stack: d.errorStack,
      });
      return api.ok({ ok: true, result });
    }
    return api.error(400, "유효하지 않은 액션", { code: "INVALID_ACTION" });
  } catch (err) {
    api.logError(err);
    return api.error(500, "액션 실패", { code: "SELF_HEAL_ACTION_FAILED" });
  }
}
