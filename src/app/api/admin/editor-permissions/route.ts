import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { getEditorEmails, setEditorEmails } from "@/lib/services/site-content-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.editor-permissions.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const emails = await getEditorEmails();
  return api.ok({ ok: true, emails });
}

const PutSchema = z.object({
  emails: z.array(z.string().email("이메일 형식이 올바르지 않습니다")).max(100)
});

export async function PUT(req: Request) {
  const api = createAdminRequestContext("admin.editor-permissions.set");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const v = PutSchema.safeParse(parsed.body);
  if (!v.success) {
    return api.error(400, firstZodMessage(v.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    await setEditorEmails(v.data.emails, guard.user.email);
    const emails = await getEditorEmails();
    return api.ok({ ok: true, emails });
  } catch (err) {
    api.logError(err);
    return api.error(500, "저장 실패", { code: "EDITOR_PERMISSIONS_SET_FAILED" });
  }
}
