import { NextResponse } from "next/server";
import { listCourses } from "@/lib/services/course-service";

export async function GET() {
  const courses = await listCourses();
  return NextResponse.json({ ok: true, courses });
}
