import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  ALL_CLOSE_ACTIONS,
  runCloseFlow,
  type CloseAction,
} from "@/lib/services/one-click-close-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ACTION_SET = new Set<CloseAction>(ALL_CLOSE_ACTIONS);

function normalizeActions(input: unknown): CloseAction[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const out: CloseAction[] = [];
  for (const a of input) {
    if (typeof a === "string" && ACTION_SET.has(a as CloseAction)) {
      out.push(a as CloseAction);
    }
  }
  return out.length ? out : undefined;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const api = createAdminRequestContext("admin.cases.close-flow.post");
  if (!(await isFeatureEnabled("one_click_close"))) {
    return api.error(403, "원클릭 종결 기능이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const { id } = await context.params;
  if (!id) return api.error(400, "사건 ID가 필요합니다.", { code: "INVALID_ID" });

  const body = await safeReadJsonBody(request);
  const parsed = body.ok ? (body.body as { actions?: unknown; actorName?: string; trigger?: string }) : {};

  try {
    const result = await runCloseFlow({
      caseId: id,
      actorName: parsed.actorName ?? null,
      actions: normalizeActions(parsed.actions),
      trigger: typeof parsed.trigger === "string" ? parsed.trigger : "admin.button",
    });
    return api.ok({ ok: true, result });
  } catch (err) {
    api.logError(err);
    return api.error(500, (err as Error).message ?? "실행 실패", { code: "CLOSE_FLOW_FAILED" });
  }
}

export async function GET() {
  const api = createAdminRequestContext("admin.cases.close-flow.get");
  return api.ok({ ok: true, actions: ALL_CLOSE_ACTIONS });
}
