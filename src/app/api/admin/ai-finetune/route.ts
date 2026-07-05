import { NextResponse } from "next/server";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  exportAnthropicFormat,
  exportJsonl,
  getStats,
  listEntries,
  previewRandom,
  type FinetuneService,
} from "@/lib/services/finetune-dataset-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseService(v: string | null): FinetuneService | undefined {
  if (!v) return undefined;
  if (v === "auto-reply" || v === "drafting" || v === "consultation-script" || v === "other") return v;
  return undefined;
}

export async function GET(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "list";
  const service = parseService(url.searchParams.get("service"));

  if (action === "stats") {
    const stats = await getStats();
    return NextResponse.json({ ok: true, stats });
  }
  if (action === "preview") {
    const n = Number(url.searchParams.get("n") ?? 5);
    const items = await previewRandom(Math.min(20, Math.max(1, n)));
    return NextResponse.json({ ok: true, items });
  }
  if (action === "export") {
    const format = url.searchParams.get("format") ?? "jsonl";
    if (format === "jsonl") {
      const body = await exportJsonl(service);
      return new NextResponse(body, {
        headers: {
          "content-type": "application/x-ndjson",
          "content-disposition": `attachment; filename="finetune-${service ?? "all"}.jsonl"`,
        },
      });
    }
    if (format === "anthropic") {
      const body = await exportAnthropicFormat(service);
      return new NextResponse(body, {
        headers: {
          "content-type": "application/json",
          "content-disposition": `attachment; filename="finetune-${service ?? "all"}-anthropic.json"`,
        },
      });
    }
    return NextResponse.json({ error: "unknown format" }, { status: 400 });
  }
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const result = await listEntries({ service, limit, offset });
  return NextResponse.json({ ok: true, ...result });
}
