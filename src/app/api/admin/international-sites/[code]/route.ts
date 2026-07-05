import { NextResponse } from "next/server";
import { getRegion, isRegionCode, updateRegion } from "@/lib/services/international-site-service";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!isRegionCode(code)) return NextResponse.json({ ok: false, error: "INVALID_REGION" }, { status: 400 });
  const region = await getRegion(code);
  return NextResponse.json({ ok: true, region });
}

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!isRegionCode(code)) return NextResponse.json({ ok: false, error: "INVALID_REGION" }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const region = await updateRegion(code, body);
  return NextResponse.json({ ok: true, region });
}
