import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  loadWorkflowRules,
  saveWorkflowRules,
  simulateWorkflow,
  type WorkflowRule
} from "@/lib/services/workflow-engine";

export async function GET() {
  const api = createAdminRequestContext("admin.workflows.get");
  try {
    const rules = await loadWorkflowRules();
    return api.ok({ ok: true, rules });
  } catch (err) {
    api.logError(err);
    return api.error(500, "워크플로 규칙 조회 실패", { code: "WORKFLOWS_GET_FAILED" });
  }
}

export async function PUT(request: Request) {
  const api = createAdminRequestContext("admin.workflows.put");
  const bodyResult = await safeReadJsonBody(request);
  if (!bodyResult.ok) {
    return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
  }
  const body = bodyResult.body as { rules?: WorkflowRule[] };
  if (!Array.isArray(body.rules)) {
    return api.error(400, "rules 배열이 필요합니다.", { code: "INVALID_RULES" });
  }
  try {
    await saveWorkflowRules(body.rules);
    const rules = await loadWorkflowRules();
    return api.ok({ ok: true, rules });
  } catch (err) {
    api.logError(err);
    return api.error(500, "워크플로 규칙 저장 실패", { code: "WORKFLOWS_PUT_FAILED" });
  }
}

export async function POST(request: Request) {
  // Test / simulate action
  const api = createAdminRequestContext("admin.workflows.simulate");
  const bodyResult = await safeReadJsonBody(request);
  if (!bodyResult.ok) {
    return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
  }
  const body = bodyResult.body as {
    entity?: "inquiry" | "case";
    fromStatus?: string;
    toStatus?: string;
  };
  if (!body.entity || !body.toStatus) {
    return api.error(400, "entity, toStatus 필요.", { code: "INVALID_SIMULATE_INPUT" });
  }
  try {
    const matched = await simulateWorkflow(body.entity, body.fromStatus, body.toStatus);
    return api.ok({ ok: true, matched });
  } catch (err) {
    api.logError(err);
    return api.error(500, "시뮬레이션 실패", { code: "WORKFLOWS_SIMULATE_FAILED" });
  }
}
