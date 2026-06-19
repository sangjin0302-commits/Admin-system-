import { createAdminRequestContext } from "@/lib/http/admin-api";
import { scanAndConvertQualifyingInquiries } from "@/lib/services/auto-case-conversion-service";

export async function POST(_request: Request) {
  const api = createAdminRequestContext("admin.auto-conversion.run");
  try {
    const result = await scanAndConvertQualifyingInquiries();
    return api.ok({ ok: true, ...result });
  } catch (error) {
    api.logError(error);
    return api.error(500, "자동 전환 실행 실패", { code: "AUTO_CONVERT_FAILED" });
  }
}
