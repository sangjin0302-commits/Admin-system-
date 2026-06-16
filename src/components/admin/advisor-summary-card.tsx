import Link from "next/link";

import { buildAdvisorReport, type AdvicePriority } from "@/lib/services/advisor-service";

const DOT: Record<AdvicePriority, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-sky-500",
  good: "bg-emerald-500"
};

/** 대시보드용 운영 참모 요약 — 상위 조언 3건 + 핵심 지표. */
export async function AdvisorSummaryCard() {
  const report = await buildAdvisorReport();
  const m = report.metrics;
  // 긴급/주의 우선 정렬, 상위 3건
  const order: AdvicePriority[] = ["high", "medium", "low", "good"];
  const top = [...report.cards]
    .sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority))
    .slice(0, 3);

  return (
    <div className="rounded-[20px] border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-gold-soft/20 p-5 shadow-panel sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">운영 참모</p>
          <h2 className="mt-1 text-lg font-semibold text-text-strong">지금 챙길 일</h2>
        </div>
        <Link
          href="/admin/advisor"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-white transition hover:bg-[#143d5d]"
        >
          전체 조언 →
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {m.overdue > 0 && <Pill tone="rose" label={`기한경과 ${m.overdue}`} />}
        {m.dueSoon > 0 && <Pill tone="rose" label={`임박 ${m.dueSoon}`} />}
        {m.newInquiries > 0 && <Pill tone="amber" label={`신규문의 ${m.newInquiries}`} />}
        {m.noNextAction > 0 && <Pill tone="amber" label={`액션미설정 ${m.noNextAction}`} />}
        <Pill tone="slate" label={`진행사건 ${m.openCases}`} />
      </div>

      <ul className="mt-4 space-y-2.5">
        {top.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${DOT[c.priority]}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-strong">{c.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pill({ tone, label }: { tone: "rose" | "amber" | "slate"; label: string }) {
  const cls =
    tone === "rose"
      ? "bg-rose-100 text-rose-700"
      : tone === "amber"
      ? "bg-amber-100 text-amber-800"
      : "bg-surface text-text-muted";
  return <span className={`rounded-full px-2.5 py-1 font-semibold ${cls}`}>{label}</span>;
}
