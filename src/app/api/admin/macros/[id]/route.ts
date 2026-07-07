import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { deleteMacro, getMacro, updateMacro, type MacroInput } from "@/lib/services/macro-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const api = createAdminRequestContext("admin.macros.get");
  if (!(await isFeatureEnabled("macro_system"))) {
    return api.error(403, "매크로 시스템이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const { id } = await context.params;
  const macro = await getMacro(id);
  if (!macro) return api.error(404, "매크로를 찾을 수 없습니다.", { code: "NOT_FOUND" });
  return api.ok({ ok: true, macro });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const api = createAdminRequestContext("admin.macros.update");
  if (!(await isFeatureEnabled("macro_system"))) {
    return api.error(403, "매크로 시스템이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const { id } = await context.params;
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  try {
    const macro = await updateMacro(id, parsed.body as Partial<MacroInput>);
    if (!macro) return api.error(404, "매크로를 찾을 수 없습니다.", { code: "NOT_FOUND" });
    return api.ok({ ok: true, macro });
  } catch (err) {
    api.logError(err);
    return api.error(400, (err as Error).message ?? "수정 실패", { code: "UPDATE_FAILED" });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const api = createAdminRequestContext("admin.macros.delete");
  if (!(await isFeatureEnabled("macro_system"))) {
    return api.error(403, "매크로 시스템이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const { id } = await context.params;
  const removed = await deleteMacro(id);
  if (!removed) return api.error(404, "매크로를 찾을 수 없습니다.", { code: "NOT_FOUND" });
  return api.ok({ ok: true });
}
