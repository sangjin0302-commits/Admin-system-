import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  checkAndMaybeRollback,
  getErrorBuckets,
  getRollbackConfig,
  getRollbackEvents,
  manualRollback,
  setRollbackConfig,
} from "@/lib/services/auto-rollback-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const api = createAdminRequestContext("admin.auto-rollback.list");
  try {
    const [events, config, buckets] = await Promise.all([
      getRollbackEvents(),
      getRollbackConfig(),
      getErrorBuckets(),
    ]);
    return api.ok({ ok: true, events, config, buckets });
  } catch (error) {
    api.logError(error);
    return api.error(500, "롤백 데이터 조회 실패", { code: "ROLLBACK_LIST_FAILED" });
  }
}

export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.auto-rollback.action");
  const parsed = await safeReadJsonBody(request);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문");
  const body = parsed.body as Partial<{
    action: "check" | "manual" | "config";
    reason: string;
    errorSpikeMultiplier: number;
    baselineLookbackBuckets: number;
    minAbsoluteCount: number;
  }>;
  try {
    if (body.action === "check") {
      const result = await checkAndMaybeRollback();
      return api.ok({ ok: true, result });
    }
    if (body.action === "manual") {
      const event = await manualRollback(body.reason || "관리자 수동 트리거");
      return api.ok({ ok: true, event });
    }
    if (body.action === "config") {
      const next = await setRollbackConfig({
        errorSpikeMultiplier: body.errorSpikeMultiplier,
        baselineLookbackBuckets: body.baselineLookbackBuckets,
        minAbsoluteCount: body.minAbsoluteCount,
      });
      return api.ok({ ok: true, config: next });
    }
    return api.error(400, "알 수 없는 액션");
  } catch (error) {
    api.logError(error);
    return api.error(500, "롤백 액션 실패", { code: "ROLLBACK_ACTION_FAILED" });
  }
}
