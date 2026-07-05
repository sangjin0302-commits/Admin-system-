import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { fetchAndProcess, listRecentNews } from "@/lib/services/legal-news-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const enabled = await isFeatureEnabled("legal_news_ai");
  if (!enabled) return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  const items = await listRecentNews(100);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const enabled = await isFeatureEnabled("legal_news_ai");
  if (!enabled) return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  if (body?.action === "fetch") {
    const res = await fetchAndProcess();
    return NextResponse.json({ ok: true, ...res });
  }
  return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
}
