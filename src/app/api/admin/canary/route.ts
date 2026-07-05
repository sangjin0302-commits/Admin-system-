import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  advanceCanary,
  listCanaryConfigs,
  pauseCanary,
  removeCanaryConfig,
  upsertCanaryConfig,
} from "@/lib/services/canary-rollout-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const api = createAdminRequestContext("admin.canary.list");
  try {
    const configs = await listCanaryConfigs();
    return api.ok({ ok: true, configs });
  } catch (error) {
    api.logError(error);
    return api.error(500, "카나리 조회 실패", { code: "CANARY_LIST_FAILED" });
  }
}

export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.canary.upsert");
  const parsed = await safeReadJsonBody(request);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문");
  const body = parsed.body as Partial<{
    action: "upsert" | "advance" | "pause" | "remove";
    flagKey: string;
    targetPercent: number;
    currentPercent: number;
    autoAdvance: boolean;
    newPercent: number;
  }>;
  if (!body.flagKey) return api.error(400, "flagKey 필요");
  try {
    if (body.action === "advance") {
      const cfg = await advanceCanary(body.flagKey, Number(body.newPercent ?? 0));
      return api.ok({ ok: true, config: cfg });
    }
    if (body.action === "pause") {
      const cfg = await pauseCanary(body.flagKey);
      return api.ok({ ok: true, config: cfg });
    }
    if (body.action === "remove") {
      await removeCanaryConfig(body.flagKey);
      return api.ok({ ok: true });
    }
    const cfg = await upsertCanaryConfig({
      flagKey: body.flagKey,
      targetPercent: Number(body.targetPercent ?? 0),
      currentPercent: Number(body.currentPercent ?? 0),
      autoAdvance: !!body.autoAdvance,
    });
    return api.ok({ ok: true, config: cfg });
  } catch (error) {
    api.logError(error);
    return api.error(500, "카나리 처리 실패", { code: "CANARY_UPSERT_FAILED" });
  }
}
