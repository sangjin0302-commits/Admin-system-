import { listWeeks, getAreaRanking } from "@/lib/services/content-metrics-service";

import { ContentMetricsManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function AdminContentMetricsPage() {
  const [weeks, ranking] = await Promise.all([listWeeks(), getAreaRanking()]);

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">성장 · 콘텐츠</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">콘텐츠 주간 성과</h2>
      <p className="mt-2 text-sm text-text-muted">
        네이버 블로그·LinkedIn 지표를 매주 직접 입력하면, 전주 대비 증감과 분야별 우선순위 통계를 자동으로 계산합니다.
        (외부 연동 없음 — 각 채널 통계 화면에서 숫자를 옮겨 적으세요.)
      </p>

      <div className="mt-6">
        <ContentMetricsManager initialWeeks={weeks} initialRanking={ranking} />
      </div>
    </section>
  );
}
