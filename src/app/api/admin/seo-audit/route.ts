import { NextResponse } from "next/server";

import { runSeoAudit } from "@/lib/services/seo-audit-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let url: string;
  try {
    const body = (await req.json()) as { url?: unknown };
    if (typeof body.url !== "string" || body.url.trim().length === 0) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }
    url = body.url.trim();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await runSeoAudit(url);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "감사 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
