import { NextResponse } from "next/server";
import { listCourses, upsertCourse } from "@/lib/services/course-service";

export async function GET() {
  const courses = await listCourses(true);
  return NextResponse.json({ ok: true, courses });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || typeof body.price !== "number") {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const course = await upsertCourse(body);
  return NextResponse.json({ ok: true, course });
}
