import { notFound } from "next/navigation";
import { getCourse } from "@/lib/services/course-service";
import { PurchaseButton } from "./purchase-button";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course || !course.published) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="ui-kicker">Online Course</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-primary">{course.title}</h1>
      <p className="mt-2 text-lg font-semibold text-gold-deep">
        ₩{course.price.toLocaleString()}
      </p>

      {course.thumbnailUrl && (
        <div className="mt-6 aspect-video overflow-hidden rounded-xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={course.thumbnailUrl} alt={`${course.title} 강의 썸네일`} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-text-strong">
        <p className="whitespace-pre-line">{course.description}</p>
      </div>

      {course.curriculum && (
        <section className="mt-8">
          <h2 className="font-serif text-lg font-bold text-primary">커리큘럼</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-text-muted">{course.curriculum}</p>
        </section>
      )}

      <div className="mt-10">
        <PurchaseButton courseId={course.id} price={course.price} title={course.title} />
      </div>
    </main>
  );
}
