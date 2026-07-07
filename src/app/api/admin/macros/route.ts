import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { listMacros, saveMacro, type MacroInput } from "@/lib/services/macro-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const api = createAdminRequestContext("admin.macros.list");
  if (!(await isFeatureEnabled("macro_system"))) {
    return api.error(403, "매크로 시스템이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  try {
    const macros = await listMacros();
    return api.ok({ ok: true, macros });
  } catch (err) {
    api.logError(err);
    return api.error(500, "목록 로드 실패", { code: "LIST_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.macros.create");
  if (!(await isFeatureEnabled("macro_system"))) {
    return api.error(403, "매크로 시스템이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const body = parsed.body as Partial<MacroInput>;
  if (!body.name || !Array.isArray(body.steps)) {
    return api.error(400, "name과 steps가 필요합니다.", { code: "INVALID_INPUT" });
  }
  try {
    const macro = await saveMacro({
      name: body.name,
      description: body.description,
      steps: body.steps,
      hotkey: body.hotkey,
      createdBy: body.createdBy,
    });
    return api.ok({ ok: true, macro });
  } catch (err) {
    api.logError(err);
    return api.error(400, (err as Error).message ?? "저장 실패", { code: "SAVE_FAILED" });
  }
}
