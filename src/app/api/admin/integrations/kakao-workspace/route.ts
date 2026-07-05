import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  parseCommand,
  executeCommand,
  listInteractions,
  logInteraction,
  COMMAND_REFERENCE,
} from "@/lib/services/kakao-workspace-bot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.integrations.kakao_workspace.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const interactions = await listInteractions();
    return api.ok({
      ok: true,
      commands: COMMAND_REFERENCE,
      interactions,
      env: {
        secret: Boolean(process.env.KAKAO_WORKSPACE_SECRET?.trim()),
        token: Boolean(process.env.KAKAO_WORKSPACE_TOKEN?.trim()),
      },
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "카카오 워크스페이스 조회 실패", { code: "KAKAO_WS_GET_FAILED" });
  }
}

const TestSchema = z.object({ text: z.string().min(1) });

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.integrations.kakao_workspace.test");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = TestSchema.safeParse(parsed.body);
  if (!validation.success) return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });

  try {
    const cmd = parseCommand(validation.data.text);
    const response = await executeCommand(cmd);
    await logInteraction({
      sender: "admin_test",
      inputText: validation.data.text,
      command: cmd.type,
      response,
      ok: true,
    });
    return api.ok({ ok: true, command: cmd, response });
  } catch (err) {
    api.logError(err);
    return api.error(500, "명령 실행 실패", { code: "KAKAO_WS_EXEC_FAILED" });
  }
}
