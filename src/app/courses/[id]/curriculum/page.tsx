import { notFound } from "next/navigation";
import Link from "next/link";
import { getCourse } from "@/lib/services/course-service";
import { getCurriculum, isCompleted } from "@/lib/services/certification-course-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export default async function CurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isFeatureEnabled("certification_courses"))) notFound();
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();
  const curriculum = await getCurriculum(id);
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const { percent, done } = userId ? await isCompleted(userId, id) : { percent: 0, done: false };

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="ui-kicker">Curriculum</p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-primary">{course.title}</h1>
      {userId && (
        <div className="mt-4">
          <div className="h-2 w-full rounded bg-line">
            <div className="h-2 rounded bg-primary" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-xs text-text-muted">진도 {percent}%</p>
          {done && (
            <Link href={`/courses/${id}/certificate`} className="mt-2 inline-block rounded bg-primary px-3 py-1.5 text-xs font-bold text-white">
              수료증 다운로드
            </Link>
          )}
        </div>
      )}

      <ul className="mt-8 space-y-3">
        {(curriculum?.modules ?? []).map((m, idx) => (
          <li key={m.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gold-deep">Module {idx + 1}</p>
                <h2 className="mt-1 font-serif text-lg font-bold text-primary">{m.title}</h2>
                {m.description && <p className="mt-1 text-sm text-text-muted">{m.description}</p>}
              </div>
              <Link
                href={`/courses/${id}/module/${m.id}`}
                className="rounded border border-primary px-3 py-1.5 text-xs font-bold text-primary"
              >
                학습하기
              </Link>
            </div>
          </li>
        ))}
        {(!curriculum || curriculum.modules.length === 0) && (
          <li className="rounded-lg border border-line bg-surface p-6 text-center text-text-muted">
            커리큘럼이 아직 구성되지 않았습니다.
          </li>
        )}
      </ul>
    </main>
  );
}
