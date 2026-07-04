import { NextResponse } from "next/server";

import {
  deleteLanding,
  getLanding,
  updateLanding,
  type LandingBlock
} from "@/lib/services/landing-page-service";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const record = await getLanding(slug);
  if (!record) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, record });
}

export async function PUT(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = (await request.json().catch(() => null)) as
    | { title?: unknown; blocks?: unknown }
    | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const patch: { title?: string; blocks?: LandingBlock[] } = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (Array.isArray(body.blocks)) patch.blocks = body.blocks as LandingBlock[];
  const record = await updateLanding(slug, patch);
  if (!record) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, record });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  await deleteLanding(slug);
  return NextResponse.json({ ok: true });
}
