import { NextResponse } from "next/server";

import {
  createKeywordLandingFromQuery,
  deleteKeywordLanding,
  getExtraKeywordLandings,
} from "@/lib/services/keyword-landing-service";

// /api/admin/* 는 미들웨어에서 관리자 인증으로 보호됨(landing 라우트와 동일 패턴).
export async function GET() {
  const items = await getExtraKeywordLandings();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { query?: unknown; group?: unknown; description?: unknown }
    | null;
  if (!body || typeof body.query !== "string" || !body.query.trim()) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  try {
    const record = await createKeywordLandingFromQuery(body.query, {
      group: typeof body.group === "string" ? body.group : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
    });
    return NextResponse.json({ ok: true, record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CREATE_FAILED";
    const status = message === "SLUG_EXISTS" ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "MISSING_SLUG" }, { status: 400 });
  }
  await deleteKeywordLanding(slug);
  return NextResponse.json({ ok: true });
}
