export { GET } from "./route-safe-v2";
/*

import { createAdminRequestContext } from "@/lib/http/admin-api";
import { getSystemHealthSnapshot } from "@/lib/services/system-health-service-safe";

export async function GET() {
  const api = createAdminRequestContext("admin.system.health.get");
  try {
    const snapshot = await getSystemHealthSnapshot();
    return api.ok({ ok: true, snapshot });
  } catch (error) {
    api.logError(error);
    return api.error(500, "시스템 상태를 불러오지 못했습니다.", {
      code: "BUILD_SYSTEM_HEALTH_SNAPSHOT_FAILED"
    });
  }
}
*/
