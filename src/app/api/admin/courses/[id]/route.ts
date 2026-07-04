import { NextResponse } from "next/server";
import { deleteCourse, getCourse, upsertCourse } from "@/lib/services/course-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, course });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });
  const course = await upsertCourse({ ...body, id });
  return NextResponse.json({ ok: true, course });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteCourse(id);
  return NextResponse.json({ ok });
}
