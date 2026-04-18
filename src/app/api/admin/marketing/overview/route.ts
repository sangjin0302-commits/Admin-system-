import { createAdminRequestContext } from "@/lib/http/admin-api";
import { readMarketingSnapshot } from "@/lib/services/marketing-sync-service";

export async function GET() {
  const api = createAdminRequestContext("admin.marketing.overview.get");
  try {
    const snapshot = await readMarketingSnapshot();
    if (!snapshot) {
      return api.error(404, "저장된 마케팅 스냅샷이 없습니다.", {
        code: "MARKETING_SNAPSHOT_NOT_FOUND"
      });
    }
    return api.ok({ ok: true, snapshot });
  } catch (error) {
    api.logError(error);
    return api.error(500, "마케팅 스냅샷을 불러오지 못했습니다.", {
      code: "LOAD_MARKETING_SNAPSHOT_FAILED"
    });
  }
}
