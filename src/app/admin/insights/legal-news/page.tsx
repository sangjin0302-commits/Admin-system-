import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { listRecentNews } from "@/lib/services/legal-news-service";
import { LegalNewsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function LegalNewsPage() {
  const enabled = await isFeatureEnabled("legal_news_ai");
  const news = enabled ? await listRecentNews(100) : [];
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Insights</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">법률 뉴스 AI 요약</h2>
      <p className="mt-2 text-sm text-text-muted">
        매일 아침 RSS 피드에서 법률 뉴스를 수집하고 AI 요약과 함께 활성 사건에 자동 매칭합니다.
      </p>
      {!enabled ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          legal_news_ai 기능이 비활성화되어 있습니다.
        </p>
      ) : (
        <div className="mt-6">
          <LegalNewsClient initial={news} />
        </div>
      )}
    </section>
  );
}
