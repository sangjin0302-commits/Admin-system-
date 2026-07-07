import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { runMacro, type MacroRunContext } from "@/lib/services/macro-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const api = createAdminRequestContext("admin.macros.run");
  if (!(await isFeatureEnabled("macro_system"))) {
    return api.error(403, "매크로 시스템이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const { id } = await context.params;
  const parsed = await safeReadJsonBody(req);
  const ctx: MacroRunContext = parsed.ok && parsed.body && typeof parsed.body === "object"
    ? (parsed.body as MacroRunContext)
    : {};
  try {
    const result = await runMacro(id, ctx);
    return api.ok({ ok: true, result });
  } catch (err) {
    api.logError(err);
    return api.error(500, (err as Error).message ?? "실행 실패", { code: "RUN_FAILED" });
  }
}
