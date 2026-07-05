import { notFound } from "next/navigation";
import { getCourse } from "@/lib/services/course-service";
import { getCurriculum } from "@/lib/services/certification-course-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { CurriculumEditor } from "./curriculum-editor";

export const dynamic = "force-dynamic";

export default async function AdminCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isFeatureEnabled("certification_courses"))) notFound();
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();
  const curriculum = await getCurriculum(id);

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
      <p className="ui-kicker">Curriculum Editor</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">{course.title} — 커리큘럼</h2>
      <CurriculumEditor
        courseId={id}
        initial={curriculum ?? { id: `cur_${id}`, courseId: id, modules: [], requiredForCertificate: true, updatedAt: "" }}
      />
    </section>
  );
}
