import { getNaverReviewSummary } from "@/lib/services/naver-review-service";

import { NaverReviewsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function AdminNaverReviewsPage() {
  const summary = await getNaverReviewSummary();

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">홈페이지 · Naver Place</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">네이버 방문자 후기 관리</h2>
      <p className="mt-2 text-sm text-text-muted">
        Naver Place는 공식 API가 없어, 후기를 직접 붙여넣어 관리합니다. 저장하면 홈페이지의 후기 밴드에
        1시간 캐시로 반영됩니다.
      </p>

      <div className="mt-4 rounded-lg bg-surface-muted/40 p-4 text-sm">
        <p>
          현재 등록: <strong>{summary.count}개</strong> · 평균 별점 <strong>{summary.avgRating.toFixed(1)}</strong>
        </p>
        {summary.placeUrl && (
          <p className="mt-1 text-xs text-text-muted">
            연결된 Naver Place URL: <code>{summary.placeUrl}</code>
          </p>
        )}
      </div>

      <div className="mt-6">
        <NaverReviewsForm initial={summary.reviews} />
      </div>
    </section>
  );
}
