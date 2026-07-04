import Link from "next/link";

import {
  getSearchTrend,
  getTopSearchTerms,
  getUnansweredSearches,
} from "@/lib/services/search-log-service";

import { PromoteButton } from "./promote-button";

export const dynamic = "force-dynamic";

const RANGE_OPTIONS = [7, 30, 90];

function normalizeDays(raw: string | undefined): number {
  const n = raw ? parseInt(raw, 10) : 30;
  if (!Number.isFinite(n)) return 30;
  if (RANGE_OPTIONS.includes(n)) return n;
  return 30;
}

function TrendChart({ points }: { points: { date: string; count: number }[] }) {
  const width = 720;
  const height = 160;
  const padL = 30;
  const padR = 10;
  const padT = 10;
  const padB = 22;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(1, ...points.map((p) => p.count));
  const n = points.length;
  const step = n > 1 ? innerW / (n - 1) : 0;
  const path = points
    .map((p, i) => {
      const x = padL + i * step;
      const y = padT + innerH - (p.count / max) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface p-4">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="검색량 추이">
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="currentColor" opacity={0.2} />
        <path d={path} fill="none" stroke="rgb(37,99,235)" strokeWidth={1.6} />
        {points.map((p, i) => {
          const x = padL + i * step;
          const y = padT + innerH - (p.count / max) * innerH;
          return <circle key={p.date} cx={x} cy={y} r={2} fill="rgb(37,99,235)"><title>{`${p.date} · ${p.count}회`}</title></circle>;
        })}
        <text x={padL} y={padT + 8} fontSize={9} opacity={0.6} fill="currentColor">최대 {max}</text>
        {n > 0 && (
          <>
            <text x={padL} y={height - 6} fontSize={9} opacity={0.6} fill="currentColor">
              {points[0].date}
            </text>
            <text x={padL + innerW} y={height - 6} fontSize={9} textAnchor="end" opacity={0.6} fill="currentColor">
              {points[n - 1].date}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export default async function AdminSearchTrendsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const daysRaw = Array.isArray(params.days) ? params.days[0] : params.days;
  const days = normalizeDays(daysRaw);

  const [top, unanswered, trend] = await Promise.all([
    getTopSearchTerms(days, 20),
    getUnansweredSearches(days, 20),
    getSearchTrend(days),
  ]);

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">마케팅 · 검색 인사이트</p>
          <h2 className="mt-2 text-xl font-semibold text-text-strong">키워드 검색 트렌드</h2>
          <p className="mt-2 text-sm text-text-muted">
            사이트 내부 검색어 로그(최대 1,000건 링 버퍼)에서 상위 키워드와 결과가 없는 검색을 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r}
              href={`/admin/marketing/search-trends?days=${r}`}
              className={`h-9 rounded-lg border px-3 text-xs font-semibold ${
                r === days
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-text-muted"
              } inline-flex items-center`}
            >
              최근 {r}일
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="ui-kicker mb-2">일자별 검색량 추이</p>
        <TrendChart points={trend} />
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/40 text-xs">
            <tr>
              <th className="px-3 py-2 text-left">순위</th>
              <th className="px-3 py-2 text-left">검색어</th>
              <th className="px-3 py-2 text-right">검색 횟수</th>
              <th className="px-3 py-2 text-right">평균 결과 수</th>
              <th className="px-3 py-2 text-left">마지막 검색</th>
              <th className="px-3 py-2 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {top.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-text-muted">
                  이 기간에 검색 로그가 없습니다.
                </td>
              </tr>
            ) : (
              top.map((t, i) => (
                <tr key={t.term} className="border-t border-line">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{t.term}</td>
                  <td className="px-3 py-2 text-right">{t.count}</td>
                  <td className="px-3 py-2 text-right">{t.avgHits.toFixed(1)}</td>
                  <td className="px-3 py-2 text-xs text-text-muted">{t.lastSeen.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-right">
                    <PromoteButton term={t.term} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h3 className="text-base font-semibold text-text-strong">
          &ldquo;0 결과&rdquo; 검색 — 콘텐츠 갭
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          결과가 0건인 검색어는 아직 사이트에 콘텐츠가 없다는 신호입니다.
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/40 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">검색어</th>
                <th className="px-3 py-2 text-right">횟수</th>
                <th className="px-3 py-2 text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {unanswered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-text-muted">
                    결과가 없는 검색어가 없습니다.
                  </td>
                </tr>
              ) : (
                unanswered.map((t) => (
                  <tr key={t.term} className="border-t border-line">
                    <td className="px-3 py-2">{t.term}</td>
                    <td className="px-3 py-2 text-right">{t.count}</td>
                    <td className="px-3 py-2 text-right">
                      <PromoteButton term={t.term} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
