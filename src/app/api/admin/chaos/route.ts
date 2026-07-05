import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  getChaosLog,
  isProdChaosAllowed,
  listExperiments,
  removeExperiment,
  upsertExperiment,
  type ChaosExperiment,
} from "@/lib/services/chaos-engineering-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const api = createAdminRequestContext("admin.chaos.list");
  try {
    const [experiments, log] = await Promise.all([listExperiments(), getChaosLog()]);
    return api.ok({
      ok: true,
      experiments,
      log,
      prodAllowed: isProdChaosAllowed(),
      nodeEnv: process.env.NODE_ENV ?? "development",
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "혼돈 실험 조회 실패", { code: "CHAOS_LIST_FAILED" });
  }
}

export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.chaos.upsert");
  const parsed = await safeReadJsonBody(request);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문");
  const body = parsed.body as Partial<{
    action: "upsert" | "remove";
    experiment: ChaosExperiment;
    id: string;
  }>;
  try {
    if (body.action === "remove" && body.id) {
      await removeExperiment(body.id);
      return api.ok({ ok: true });
    }
    if (!body.experiment) return api.error(400, "experiment 필요");
    const saved = await upsertExperiment(body.experiment);
    return api.ok({ ok: true, experiment: saved });
  } catch (error) {
    api.logError(error);
    return api.error(500, "혼돈 실험 처리 실패", { code: "CHAOS_UPSERT_FAILED" });
  }
}
