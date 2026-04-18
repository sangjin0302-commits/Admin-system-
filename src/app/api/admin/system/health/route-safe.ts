/*
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { getSystemHealthSnapshot } from "@/lib/services/system-health-service-safe-v3";

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

import { createAdminRequestContext } from "@/lib/http/admin-api";
import { getSystemHealthSnapshot } from "@/lib/services/system-health-service-safe-v3";

const KO_HEALTH_LOAD_FAILED =
  "\uC2DC\uC2A4\uD15C \uD5EC\uC2A4 \uC2A4\uB0C5\uC0F7\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";

export async function GET() {
  const api = createAdminRequestContext("admin.system.health.get");

  try {
    const snapshot = await getSystemHealthSnapshot();
    return api.ok({ ok: true, snapshot });
  } catch (error) {
    api.logError(error);
    return api.error(500, KO_HEALTH_LOAD_FAILED, {
      code: "BUILD_SYSTEM_HEALTH_SNAPSHOT_FAILED"
    });
  }
}
