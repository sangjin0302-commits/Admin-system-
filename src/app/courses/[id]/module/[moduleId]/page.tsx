import { notFound } from "next/navigation";
import { getCurriculum } from "@/lib/services/certification-course-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { ModulePlayer } from "./module-player";

export const dynamic = "force-dynamic";

export default async function ModulePage({ params }: { params: Promise<{ id: string; moduleId: string }> }) {
  if (!(await isFeatureEnabled("certification_courses"))) notFound();
  const { id, moduleId } = await params;
  const curriculum = await getCurriculum(id);
  const module = curriculum?.modules.find((m) => m.id === moduleId);
  if (!module) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-primary">{module.title}</h1>
      <ModulePlayer courseId={id} moduleId={moduleId} module={module} />
    </main>
  );
}
