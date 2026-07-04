import { loadTrustBadges } from "@/components/public/trust-belt";

import { TrustBadgesForm } from "./form";

export const dynamic = "force-dynamic";

/**
 * 관리자 — 신뢰 뱃지 편집 페이지 (홈페이지 벨트에 노출).
 */
export default async function AdminTrustBadgesPage() {
  const badges = await loadTrustBadges();

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">홈페이지 운영</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">신뢰 뱃지 벨트</h2>
      <p className="mt-2 text-sm text-text-muted">
        홈페이지 &quot;언론에 소개된 ETHOS&quot; 벨트에 노출되는 기관·언론 로고를 관리합니다.
        아이콘 URL을 비워두면 텍스트 뱃지로 표시됩니다.
      </p>

      <div className="mt-6">
        <TrustBadgesForm initial={badges} />
      </div>
    </section>
  );
}
