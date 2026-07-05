import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  getHistory,
  getSuite,
  removeTest,
  runRegressionSuite,
  upsertTest,
  type RegressionTest,
} from "@/lib/services/ai-regression-test-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const api = createAdminRequestContext("admin.ai-regression.list");
  try {
    const [suite, history] = await Promise.all([getSuite(), getHistory()]);
    return api.ok({ ok: true, suite, history });
  } catch (error) {
    api.logError(error);
    return api.error(500, "회귀 스위트 조회 실패", { code: "AI_REGRESSION_LIST_FAILED" });
  }
}

export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.ai-regression.action");
  const parsed = await safeReadJsonBody(request);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문");
  const body = parsed.body as Partial<{
    action: "run" | "upsert" | "remove";
    test: RegressionTest;
    id: string;
  }>;
  try {
    if (body.action === "run") {
      const run = await runRegressionSuite();
      return api.ok({ ok: true, run });
    }
    if (body.action === "remove" && body.id) {
      await removeTest(body.id);
      return api.ok({ ok: true });
    }
    if (body.action === "upsert" && body.test) {
      await upsertTest(body.test);
      return api.ok({ ok: true });
    }
    return api.error(400, "알 수 없는 액션");
  } catch (error) {
    api.logError(error);
    return api.error(500, "회귀 처리 실패", { code: "AI_REGRESSION_ACTION_FAILED" });
  }
}
