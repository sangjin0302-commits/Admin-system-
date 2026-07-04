import { NextResponse } from "next/server";

import { searchCaseStories } from "@/lib/services/case-story-search-service";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limitRaw = Number(url.searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 12;

  if (!q) {
    return NextResponse.json({ ok: true, matches: [] });
  }

  const ip = getClientIpFromHeaders(req.headers) ?? "unknown";
  const rl = consumeRateLimit({
    namespace: "public:case-search",
    key: ip,
    max: 60,
    windowMs: 60_000
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const matches = await searchCaseStories(q, limit);
    return NextResponse.json({ ok: true, matches });
  } catch {
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
