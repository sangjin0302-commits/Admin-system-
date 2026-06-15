import Link from "next/link";

import { buildAdvisorReport, type AdvicePriority } from "@/lib/services/advisor-service";

export const dynamic = "force-dynamic";

const PRIORITY_STYLE: Record<AdvicePriority, { badge: string; ring: string; label: string }> = {
  high: { badge: "bg-rose-100 text-rose-800", ring: "border-l-rose-400", label: "긴급" },
  medium: { badge: "bg-amber-100 text-amber-800", ring: "border-l-amber-400", label: "주의" },
  low: { badge: "bg-sky-100 text-sky-800", ring: "border-l-sky-400", label: "참고" },
  good: { badge: "bg-emerald-100 text-emerald-800", ring: "border-l-emerald-400", label: "루틴" }
};

function Metric({ label, value, tone }: { label: string; value: number; tone?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3 text-center">
      <p className={`text-2xl font-bold ${tone && value > 0 ? "text-rose-600" : "text-text-strong"}`}>{value}</p>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </div>
  );
}

export default async function AdminAdvisorPage() {
  const report = await buildAdvisorReport();
  const m = report.metrics;

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">운영 참모</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">행정사 운영 조언</h2>
      <p className="mt-2 text-sm text-text-muted">
        지금 사무소 상태를 분석해 우선순위 있는 할 일을 제안합니다. 데이터 기반 자동 분석이며, 실제 판단은 담당 행정사가 합니다.
      </p>

      {/* 지표 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="신규 문의" value={m.newInquiries} tone />
        <Metric label="정체 상담" value={m.staleInquiries} tone />
        <Metric label="진행 사건" value={m.openCases} />
        <Metric label="기한 임박" value={m.dueSoon} tone />
        <Metric label="기한 경과" value={m.overdue} tone />
        <Metric label="액션 미설정" value={m.noNextAction} tone />
      </div>

      {/* 조언 카드 */}
      <div className="mt-7 space-y-3">
        {report.cards.map((card, i) => {
          const s = PRIORITY_STYLE[card.priority];
          return (
            <div key={i} className={`rounded-xl border border-line border-l-4 bg-surface-muted/40 p-4 ${s.ring}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.badge}`}>
                  {s.label}
                </span>
                <h3 className="text-sm font-bold text-text-strong">{card.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-7 text-text">{card.detail}</p>
              {card.action && (
                <Link
                  href={card.action.href}
                  className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-white transition hover:bg-[#143d5d]"
                >
                  {card.action.label} →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-text-muted">
        분석 시각: {new Date(report.generatedAt).toLocaleString("ko-KR")} · 페이지를 새로고침하면 최신 상태로 다시 분석합니다.
      </p>
    </section>
  );
}
