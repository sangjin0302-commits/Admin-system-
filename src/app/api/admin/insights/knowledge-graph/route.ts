import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { buildGraph, invalidateGraph } from "@/lib/services/knowledge-graph-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const enabled = await isFeatureEnabled("knowledge_graph");
  if (!enabled) {
    return NextResponse.json({ ok: false, error: "knowledge_graph 비활성화" }, { status: 403 });
  }
  const graph = await buildGraph(false);
  return NextResponse.json({ ok: true, graph });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  if (body?.action === "rebuild") {
    const enabled = await isFeatureEnabled("knowledge_graph");
    if (!enabled) return NextResponse.json({ ok: false }, { status: 403 });
    await invalidateGraph();
    const graph = await buildGraph(true);
    return NextResponse.json({ ok: true, graph });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
