import { listAdminCaseStudies } from "@/lib/services/case-studies";

import { CaseStudiesManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function AdminCaseStudiesPage() {
  const items = await listAdminCaseStudies();

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">홈페이지 운영</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">처리 사례 관리</h2>
      <p className="mt-2 text-sm text-text-muted">
        여기서 추가한 사례는 홈페이지 &ldquo;처리 사례&rdquo; 페이지 상단에 먼저 노출됩니다. 개인정보가 드러나지 않게 익명·요약으로
        작성해 주세요.
      </p>

      <div className="mt-6">
        <CaseStudiesManager
          initialItems={items.map((i) => ({
            id: i.id,
            category: i.category,
            title: i.title,
            summary: i.summary,
            outcome: i.outcome,
            duration: i.duration,
            published: i.published,
            sortOrder: i.sortOrder
          }))}
        />
      </div>
    </section>
  );
}
