import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  FORBIDDEN_PHRASES,
  getCustomRules,
  saveCustomRule,
  deleteCustomRule,
} from "@/lib/services/marketing-guideline-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.guideline-rules.list");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const custom = await getCustomRules();
    return api.ok({ ok: true, static: FORBIDDEN_PHRASES, custom });
  } catch (err) {
    api.logError(err);
    return api.error(500, "규칙 조회 실패", { code: "GUIDELINE_RULES_LIST_FAILED" });
  }
}

const PostSchema = z.object({
  pattern: z.string().min(1).max(200),
  isRegex: z.boolean().optional(),
  reason: z.string().min(1).max(500),
  severity: z.enum(["error", "warn"]),
  suggestion: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.guideline-rules.create");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = PostSchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    const next = await saveCustomRule(validation.data);
    return api.ok({ ok: true, custom: next });
  } catch (err) {
    api.logError(err);
    return api.error(500, "규칙 저장 실패", { code: "GUIDELINE_RULES_SAVE_FAILED" });
  }
}

export async function DELETE(req: Request) {
  const api = createAdminRequestContext("admin.guideline-rules.delete");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const pattern = url.searchParams.get("pattern");
  if (!pattern) return api.error(400, "pattern 필수", { code: "INVALID_INPUT" });

  try {
    const next = await deleteCustomRule(pattern);
    return api.ok({ ok: true, custom: next });
  } catch (err) {
    api.logError(err);
    return api.error(500, "규칙 삭제 실패", { code: "GUIDELINE_RULES_DELETE_FAILED" });
  }
}
