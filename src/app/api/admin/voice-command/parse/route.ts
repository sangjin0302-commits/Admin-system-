/**
 * POST /api/admin/voice-command/parse
 * Body: { transcript: string }
 * Returns parsed action for the mic component.
 */

import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { parseVoiceCommand } from "@/lib/services/voice-command-service";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.voice-command.parse");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("voice_command"))) {
    return api.error(403, "음성 명령이 비활성화되었습니다.", { code: "FEATURE_DISABLED" });
  }

  const body = await safeReadJsonBody(req);
  if (!body.ok) return api.error(400, "잘못된 JSON", { code: "INVALID_JSON" });

  const transcript = typeof (body.body as { transcript?: unknown }).transcript === "string"
    ? ((body.body as { transcript: string }).transcript).trim()
    : "";
  if (!transcript) return api.error(400, "transcript 필요", { code: "MISSING_TRANSCRIPT" });
  if (transcript.length > 500) return api.error(400, "너무 긴 명령", { code: "TOO_LONG" });

  try {
    const parsed = await parseVoiceCommand(transcript);
    return api.ok({ ok: true, ...parsed });
  } catch (err) {
    api.logError(err);
    return api.error(500, "명령 파싱 실패", { code: "PARSE_FAILED" });
  }
}
