import { listAdminTestimonials } from "@/lib/services/testimonials";

import { TestimonialsManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const items = await listAdminTestimonials();

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">홈페이지 운영</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">의뢰인 후기 관리</h2>
      <p className="mt-2 text-sm text-text-muted">
        여기서 추가한 후기는 홈페이지 &ldquo;의뢰인 후기&rdquo; 섹션에 노출됩니다. 반드시 의뢰인 동의를 받고 익명·요약으로 작성해 주세요.
      </p>

      <div className="mt-6">
        <TestimonialsManager
          initialItems={items.map((i) => ({
            id: i.id,
            category: i.category,
            quote: i.quote,
            author: i.author,
            context: i.context,
            published: i.published
          }))}
        />
      </div>
    </section>
  );
}
