/**
 * POST /api/admin/ai-agent/run
 * Body: { workflowId: string, entityId: string }
 * Streams SSE events (start · step:start · step:end · done · error).
 */

import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  runAgentWorkflow,
  findWorkflow,
  type AgentEvent,
} from "@/lib/services/ai-agent-orchestrator";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sseEncode(ev: AgentEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(ev)}\n\n`);
}

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("ai_agent_workflows"))) {
    return new Response(JSON.stringify({ ok: false, error: "AI 에이전트 워크플로가 비활성화되었습니다." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "잘못된 JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const parsed = body as { workflowId?: unknown; entityId?: unknown };
  const workflowId = typeof parsed.workflowId === "string" ? parsed.workflowId : "";
  const entityId = typeof parsed.entityId === "string" ? parsed.entityId : "";
  if (!workflowId || !entityId) {
    return new Response(JSON.stringify({ ok: false, error: "workflowId, entityId 필수" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!findWorkflow(workflowId)) {
    return new Response(JSON.stringify({ ok: false, error: "알 수 없는 워크플로" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: AgentEvent) => {
        try {
          controller.enqueue(sseEncode(ev));
        } catch {
          // 클라이언트 abort — ignore
        }
      };
      try {
        await runAgentWorkflow(workflowId, entityId, send);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error("[ai-agent-run] 실행 실패", { workflowId, entityId, err: msg });
        send({ type: "error", message: msg });
      } finally {
        try {
          controller.close();
        } catch {
          // ignore
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
