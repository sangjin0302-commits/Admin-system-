import Link from "next/link";
import { listCourses } from "@/lib/services/course-service";

export const dynamic = "force-dynamic";

export const metadata = { title: "온라인 강의 · ETHOS" };

const CATEGORY_LABELS: Record<string, string> = {
  visa: "비자실무",
  appeal: "행정심판",
  corporate: "법인",
  other: "기타",
};

export default async function CoursesCatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const category = params.category;
  const all = await listCourses();
  const courses = category ? all.filter((c) => c.category === category) : all;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <p className="ui-kicker">Online Courses</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-primary">온라인 강의</h1>

      <nav className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/courses"
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            !category ? "border-primary bg-primary text-white" : "border-line"
          }`}
        >
          전체
        </Link>
        {Object.entries(CATEGORY_LABELS).map(([v, label]) => (
          <Link
            key={v}
            href={`/courses?category=${v}`}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              category === v ? "border-primary bg-primary text-white" : "border-line"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/courses/${c.id}`}
            className="group rounded-xl border border-line bg-surface p-4 shadow-panel hover:border-primary"
          >
            <div className="aspect-video overflow-hidden rounded-lg bg-gold-soft/40">
              {c.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <p className="mt-3 text-xs font-bold uppercase text-gold-deep">
              {CATEGORY_LABELS[c.category] ?? c.category}
            </p>
            <h2 className="mt-1 font-serif text-lg font-bold text-primary group-hover:underline">
              {c.title}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              ₩{c.price.toLocaleString()}
            </p>
          </Link>
        ))}
        {courses.length === 0 && (
          <p className="col-span-full py-16 text-center text-text-muted">
            등록된 강의가 아직 없습니다.
          </p>
        )}
      </div>
    </main>
  );
}
