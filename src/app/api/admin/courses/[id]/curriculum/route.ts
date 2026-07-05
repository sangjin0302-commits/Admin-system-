import { NextResponse } from "next/server";
import { getCurriculum, upsertCurriculum, type Module } from "@/lib/services/certification-course-service";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const curriculum = await getCurriculum(id);
  return NextResponse.json({ ok: true, curriculum });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.modules)) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const curriculum = await upsertCurriculum({
    courseId: id,
    modules: body.modules as Module[],
    requiredForCertificate: Boolean(body.requiredForCertificate),
  });
  return NextResponse.json({ ok: true, curriculum });
}
