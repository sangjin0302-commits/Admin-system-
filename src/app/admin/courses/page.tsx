import Link from "next/link";
import { listCourses } from "@/lib/services/course-service";
import { NewCourseButton } from "./new-course-button";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const courses = await listCourses(true);
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="ui-kicker">Products</p>
          <h2 className="mt-2 text-xl font-semibold text-text-strong">온라인 강의 관리</h2>
        </div>
        <NewCourseButton />
      </div>

      <ul className="mt-6 divide-y divide-line rounded-lg border border-line">
        {courses.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="font-semibold">
                {c.title} {!c.published && <span className="text-xs text-red-500">(비공개)</span>}
              </p>
              <p className="text-xs text-text-muted">
                ₩{c.price.toLocaleString()} · {c.category}
              </p>
            </div>
            <Link
              href={`/admin/courses/${c.id}`}
              className="rounded border border-primary px-3 py-1.5 text-xs font-bold text-primary"
            >
              편집
            </Link>
          </li>
        ))}
        {courses.length === 0 && (
          <li className="px-3 py-6 text-center text-text-muted">등록된 강의 없음</li>
        )}
      </ul>
    </section>
  );
}
