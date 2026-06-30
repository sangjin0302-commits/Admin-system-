import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TestimonialForm } from "@/components/admin/testimonial-form";

export const dynamic = "force-dynamic";

export default async function TestimonialEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  const testimonial = isNew
    ? null
    : await prisma.testimonial.findUnique({ where: { id } });

  if (!isNew && !testimonial) return notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Content"
        title={isNew ? "새 후기 추가" : "후기 수정"}
        description={isNew ? "새 의뢰인 후기를 등록합니다." : "후기 내용을 수정합니다."}
      />
      <TestimonialForm testimonial={testimonial} />
    </div>
  );
}
