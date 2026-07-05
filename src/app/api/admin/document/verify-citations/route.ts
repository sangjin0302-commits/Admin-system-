import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { verifyCitations } from "@/lib/services/citation-verifier-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const enabled = await isFeatureEnabled("citation_verifier");
  if (!enabled) return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ ok: false, error: "text 필드가 필요합니다" }, { status: 400 });
  }
  const result = await verifyCitations(text);
  return NextResponse.json({ ok: true, ...result });
}
