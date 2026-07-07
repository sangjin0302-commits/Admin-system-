import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { loadClientContext, invalidateClientContext } from "@/lib/services/client-context-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalize(raw: string) {
  return decodeURIComponent(raw).trim().toLowerCase();
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ email: string }> },
) {
  const api = createAdminRequestContext("admin.clients.context.get");
  if (!(await isFeatureEnabled("client_context_sidebar"))) {
    return api.error(403, "의뢰인 컨텍스트 사이드바가 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const { email: raw } = await context.params;
  const email = normalize(raw);
  if (!email.includes("@")) return api.error(400, "유효한 이메일이 필요합니다.", { code: "INVALID_EMAIL" });
  try {
    const ctx = await loadClientContext(email);
    if (!ctx) return api.error(404, "컨텍스트를 찾지 못했습니다.", { code: "NOT_FOUND" });
    return api.ok({ ok: true, context: ctx });
  } catch (err) {
    api.logError(err);
    return api.error(500, "컨텍스트 로드 실패", { code: "CONTEXT_FAILED" });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ email: string }> },
) {
  const api = createAdminRequestContext("admin.clients.context.invalidate");
  const { email: raw } = await context.params;
  invalidateClientContext(normalize(raw));
  return api.ok({ ok: true });
}
