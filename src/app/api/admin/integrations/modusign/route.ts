import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  listTemplates,
  createSignatureRequest,
  getStatus,
  listOutbox,
  getCredentialStatus,
} from "@/lib/services/modusign-integration";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.integrations.modusign.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const [templates, outbox] = await Promise.all([listTemplates(), listOutbox()]);
    return api.ok({ ok: true, templates, outbox, creds: getCredentialStatus() });
  } catch (err) {
    api.logError(err);
    return api.error(500, "모두싸인 조회 실패", { code: "MODUSIGN_GET_FAILED" });
  }
}

const SignerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string().optional(),
});

const CreateSchema = z.object({
  action: z.literal("create"),
  caseId: z.string().optional(),
  templateId: z.string().min(1),
  templateName: z.string().optional(),
  signers: z.array(SignerSchema).min(1),
});
const PollSchema = z.object({
  action: z.literal("poll"),
  requestId: z.string().min(1),
});
const PostSchema = z.discriminatedUnion("action", [CreateSchema, PollSchema]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.integrations.modusign.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = PostSchema.safeParse(parsed.body);
  if (!validation.success) return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });

  try {
    if (validation.data.action === "create") {
      const req = await createSignatureRequest(
        validation.data.caseId,
        validation.data.templateId,
        validation.data.signers,
        validation.data.templateName,
      );
      return api.ok({ ok: true, request: req });
    }
    const status = await getStatus(validation.data.requestId);
    return api.ok({ ok: true, request: status });
  } catch (err) {
    api.logError(err);
    return api.error(500, "모두싸인 처리 실패", { code: "MODUSIGN_POST_FAILED" });
  }
}
