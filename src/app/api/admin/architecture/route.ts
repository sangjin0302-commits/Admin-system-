import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  buildArchitectureGraph,
  saveArchitectureDiagram,
  summarizeGraph,
  toMermaid,
} from "@/lib/services/architecture-diagram-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.architecture.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const enabled = await isFeatureEnabled("arch_diagram");
    if (!enabled) {
      return api.ok({ ok: false, error: "arch_diagram 기능이 비활성화 상태입니다." });
    }
    const url = new URL(req.url);
    const moduleFilter = url.searchParams.get("module") ?? undefined;
    const graph = await buildArchitectureGraph();
    const mermaid = toMermaid(graph, moduleFilter);
    const summary = summarizeGraph(graph);
    return api.ok({
      ok: true,
      mermaid,
      summary,
      generatedAt: graph.generatedAt,
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "아키텍처 그래프 조회 실패", {
      code: "ARCH_DIAGRAM_READ_FAILED",
    });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.architecture.regenerate");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const enabled = await isFeatureEnabled("arch_diagram");
    if (!enabled) {
      return api.ok({ ok: false, error: "arch_diagram 기능이 비활성화 상태입니다." });
    }
    const result = await saveArchitectureDiagram();
    const summary = summarizeGraph(result.graph);
    return api.ok({
      ok: true,
      path: result.path.replace(process.cwd(), "").replace(/\\/g, "/"),
      bytes: result.bytes,
      summary,
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "아키텍처 재생성 실패", {
      code: "ARCH_DIAGRAM_REGEN_FAILED",
    });
  }
}
