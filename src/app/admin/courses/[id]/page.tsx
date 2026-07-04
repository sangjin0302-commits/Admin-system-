import { notFound } from "next/navigation";
import { getCourse } from "@/lib/services/course-service";
import { CourseEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Course</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">강의 편집</h2>
      <div className="mt-6">
        <CourseEditor initial={course} />
      </div>
    </section>
  );
}
