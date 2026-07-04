import { NextResponse } from "next/server";

import {
  getCompetitor,
  removeCompetitor,
  updateCompetitor,
  type CompetitorInput,
} from "@/lib/services/competitor-tracker-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const entry = await getCompetitor(id);
  if (!entry) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, entry });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as Partial<CompetitorInput>;
  const entry = await updateCompetitor(id, body);
  if (!entry) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ok = await removeCompetitor(id);
  if (!ok) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
