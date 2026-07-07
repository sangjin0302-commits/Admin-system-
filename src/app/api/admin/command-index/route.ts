import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { buildCommandIndex } from "@/lib/services/command-index-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const api = createAdminRequestContext("admin.command-index.get");
  if (!(await isFeatureEnabled("command_palette"))) {
    return api.error(403, "명령 팔레트가 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  try {
    const items = await buildCommandIndex();
    return api.ok({ ok: true, items });
  } catch (err) {
    api.logError(err);
    return api.error(500, "인덱스 로드 실패", { code: "INDEX_FAILED" });
  }
}
