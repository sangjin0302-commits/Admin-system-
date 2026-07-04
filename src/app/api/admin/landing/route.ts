import { NextResponse } from "next/server";

import {
  createLanding,
  isValidLandingSlug,
  listLandings
} from "@/lib/services/landing-page-service";

export async function GET() {
  const items = await listLandings();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { slug?: unknown; title?: unknown }
    | null;
  if (!body || typeof body.slug !== "string" || typeof body.title !== "string") {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const slug = body.slug.trim().toLowerCase();
  if (!isValidLandingSlug(slug)) {
    return NextResponse.json({ ok: false, error: "INVALID_SLUG" }, { status: 400 });
  }
  try {
    const record = await createLanding(slug, body.title.trim() || slug, []);
    return NextResponse.json({ ok: true, record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CREATE_FAILED";
    const status = message === "SLUG_EXISTS" ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
