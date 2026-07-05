import { NextResponse } from "next/server";

import {
  buildCampaignDraft,
  listTopReengagement,
  scoreReengagement,
} from "@/lib/services/reengagement-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (email) {
    const one = await scoreReengagement(email);
    return NextResponse.json({ ok: true, one });
  }
  const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit")) || 50));
  const items = await listTopReengagement(limit);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { emails?: string[] };
  const emails = Array.isArray(body.emails) ? body.emails.filter((e) => typeof e === "string") : [];
  if (emails.length === 0) {
    return NextResponse.json({ ok: false, error: "NO_RECIPIENTS" }, { status: 400 });
  }
  const scored = await Promise.all(emails.map((e) => scoreReengagement(e).catch(() => null)));
  const picks = scored.filter((s): s is NonNullable<typeof s> => s != null);
  const draft = buildCampaignDraft(picks);
  return NextResponse.json({ ok: true, draft });
}
