import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  checkSimilarity,
  linkAsReuse,
  listReuseLinks,
  markIgnored,
  recentDraftsWithSimilarity,
} from "@/lib/services/document-similarity-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [recent, links] = await Promise.all([
    recentDraftsWithSimilarity(20),
    listReuseLinks(),
  ]);
  return NextResponse.json({ ok: true, recent, links });
}

export async function POST(req: Request) {
  const enabled = await isFeatureEnabled("document_similarity");
  if (!enabled) {
    return NextResponse.json({ ok: false, error: "document_similarity 비활성화" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as
    | {
        text?: string;
        excludeId?: string;
        action?: "check" | "link" | "ignore";
        newDocId?: string;
        priorDocId?: string;
        reason?: string;
      }
    | null;
  if (body?.action === "link" && body.newDocId && body.priorDocId) {
    const link = await linkAsReuse(body.newDocId, body.priorDocId, body.reason);
    return NextResponse.json({ ok: true, link });
  }
  if (body?.action === "ignore" && body.newDocId) {
    await markIgnored(body.newDocId);
    return NextResponse.json({ ok: true });
  }
  if (typeof body?.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ ok: false, error: "text 필수" }, { status: 400 });
  }
  const result = await checkSimilarity(body.text, { excludeId: body.excludeId });
  return NextResponse.json({ ok: true, ...result });
}
