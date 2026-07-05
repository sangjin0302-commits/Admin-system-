import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurriculum, markModuleComplete, scoreQuiz } from "@/lib/services/certification-course-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export async function POST(req: Request) {
  if (!(await isFeatureEnabled("certification_courses"))) {
    return NextResponse.json({ ok: false, error: "FEATURE_DISABLED" }, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.courseId || !body?.moduleId) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const curriculum = await getCurriculum(String(body.courseId));
  const module = curriculum?.modules.find((m) => m.id === body.moduleId);
  if (!module) return NextResponse.json({ ok: false, error: "MODULE_NOT_FOUND" }, { status: 404 });

  let score: number | undefined;
  if (module.quiz) {
    const answers = Array.isArray(body.answers) ? (body.answers as number[]) : [];
    score = scoreQuiz(module.quiz, answers);
  }
  const progress = await markModuleComplete(session.user.id, String(body.courseId), String(body.moduleId), score);
  return NextResponse.json({ ok: true, score, progress });
}
