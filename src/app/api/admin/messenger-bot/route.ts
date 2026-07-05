/**
 * Messenger intake bot admin API.
 * GET  — list pending
 * POST — action: approve | reject | test
 */

import { requireRole } from "@/lib/services/admin-rbac-service";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  approvePendingIntake,
  listPendingIntakes,
  processIncomingMessage,
  removePendingIntake,
} from "@/lib/services/message-intake-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.messenger-bot.list");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const pending = await listPendingIntakes();
    return api.ok({ ok: true, pending });
  } catch (err) {
    api.logError(err);
    return api.error(500, "목록 조회 실패", { code: "LIST_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.messenger-bot.action");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 JSON", { code: "INVALID_JSON" });

  const body = parsed.body as { action?: string; id?: string; text?: string };
  const action = body.action;

  try {
    if (action === "approve") {
      if (!body.id) return api.error(400, "id 필요", { code: "MISSING_ID" });
      const inquiryId = await approvePendingIntake(body.id);
      return api.ok({ ok: true, inquiryId });
    }
    if (action === "reject") {
      if (!body.id) return api.error(400, "id 필요", { code: "MISSING_ID" });
      await removePendingIntake(body.id);
      return api.ok({ ok: true });
    }
    if (action === "test") {
      if (!body.text) return api.error(400, "text 필요", { code: "MISSING_TEXT" });
      const result = await processIncomingMessage("telegram", body.text);
      return api.ok({ ok: true, result });
    }
    return api.error(400, "알 수 없는 action", { code: "BAD_ACTION" });
  } catch (err) {
    api.logError(err);
    return api.error(500, "처리 실패", { code: "ACTION_FAILED" });
  }
}
