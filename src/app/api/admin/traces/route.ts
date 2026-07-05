import { createAdminRequestContext } from "@/lib/http/admin-api";
import { getRecentTraces, exportOtlp } from "@/lib/services/tracing-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const api = createAdminRequestContext("admin.traces.list");
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    if (format === "otlp") {
      return api.ok(await exportOtlp());
    }
    const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get("limit") ?? "200")));
    const nameFilter = url.searchParams.get("name") || undefined;
    const minDurationMs = url.searchParams.get("minMs")
      ? Number(url.searchParams.get("minMs"))
      : undefined;
    const traces = await getRecentTraces(limit, { nameFilter, minDurationMs });
    return api.ok({ ok: true, traces });
  } catch (error) {
    api.logError(error);
    return api.error(500, "트레이스 조회 실패", { code: "TRACES_LIST_FAILED" });
  }
}
