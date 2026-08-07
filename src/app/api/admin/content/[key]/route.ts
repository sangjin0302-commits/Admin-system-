import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { getContent, setContent, isContentEditor } from "@/lib/services/site-content-service";
import { isValidContentKey } from "@/lib/services/site-content-keys";
import { invalidatePath } from "@/lib/services/edge-cache-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ key: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const api = createAdminRequestContext("admin.content.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const { key } = await ctx.params;
  if (!isValidContentKey(key)) {
    return api.error(404, "알 수 없는 콘텐츠 키", { code: "CONTENT_KEY_UNKNOWN" });
  }
  try {
    const value = await getContent(key);
    return api.ok({ ok: true, key, value });
  } catch (err) {
    api.logError(err);
    return api.error(500, "콘텐츠 조회 실패", { code: "CONTENT_GET_FAILED" });
  }
}

const PutSchema = z.object({
  value: z.string().max(10_000, "10,000자를 초과할 수 없습니다"),
});

export async function PUT(req: Request, ctx: Ctx) {
  const api = createAdminRequestContext("admin.content.set");
  // SUPER/MANAGER 또는 cms_editor_role flag + editor emails 등록된 사용자 허용
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF", "AUDITOR", "EXTERNAL"]);
  if (!guard.ok) return guard.response;
  const allowed = await isContentEditor(guard.user.email, guard.user.role);
  if (!allowed) {
    return api.error(403, "편집 권한 없음", { code: "FORBIDDEN" });
  }

  const { key } = await ctx.params;
  if (!isValidContentKey(key)) {
    return api.error(404, "알 수 없는 콘텐츠 키", { code: "CONTENT_KEY_UNKNOWN" });
  }

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = PutSchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    await setContent(key, validation.data.value, guard.user.email);
    // site-content(getContentBatch)는 홈이 읽는다. about 은 안전차원 포함.
    for (const p of ["/", "/en", "/about", "/en/about"]) void invalidatePath(p, `content:${key}`);
    const value = await getContent(key);
    return api.ok({ ok: true, key, value });
  } catch (err) {
    api.logError(err);
    return api.error(500, "콘텐츠 저장 실패", { code: "CONTENT_SET_FAILED" });
  }
}
