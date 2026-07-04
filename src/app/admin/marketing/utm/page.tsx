import Link from "next/link";

import {
  getUtmDashboard,
  normalizeDateRange,
  type UtmDateRange
} from "@/lib/services/utm-tracking-service";

export const dynamic = "force-dynamic";

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}
function fmtWon(v: number) {
  return `₩${v.toLocaleString("ko-KR")}`;
}

const RANGE_OPTIONS: UtmDateRange[] = [7, 30, 90];

export default async function AdminUtmDashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rangeRaw = Array.isArray(params.range) ? params.range[0] : params.range;
  const range = normalizeDateRange(rangeRaw);
  const dashboard = await getUtmDashboard(range);

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">마케팅 · 유입 분석</p>
          <h2 className="mt-2 text-xl font-semibold text-text-strong">UTM 대시보드</h2>
          <p className="mt-2 text-sm text-text-muted">
            의뢰 폼의 <code>utm_source × utm_medium × utm_campaign</code> 조합별로 유입/의뢰/전환율/예상 CPA를 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r}
              href={`/admin/marketing/utm?range=${r}`}
              className={`h-9 rounded-lg border px-3 text-xs font-semibold ${
                r === range
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-text-muted"
              } inline-flex items-center`}
            >
              최근 {r}일
            </Link>
          ))}
          <a
            href={`/api/admin/marketing/utm/export?range=${range}`}
            className="ml-2 inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-xs font-semibold"
          >
            CSV 다운로드
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Kpi label="전체 의뢰" value={dashboard.totalInquiries} hint={`${range}일 기준`} />
        <Kpi label="UTM 유입 의뢰" value={dashboard.utmInquiries} hint="캠페인 태그 있음" />
        <Kpi
          label="비트래킹 의뢰"
          value={dashboard.untrackedInquiries}
          hint="UTM 없음 (직접 유입 등)"
        />
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/40 text-xs">
            <tr>
              <th className="px-3 py-2 text-left">source</th>
              <th className="px-3 py-2 text-left">medium</th>
              <th className="px-3 py-2 text-left">campaign</th>
              <th className="px-3 py-2 text-right">유입수</th>
              <th className="px-3 py-2 text-right">의뢰수</th>
              <th className="px-3 py-2 text-right">전환율</th>
              <th className="px-3 py-2 text-right">예상 CPA</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-text-muted">
                  이 기간에 UTM 태그가 있는 유입이 없습니다.
                </td>
              </tr>
            ) : (
              dashboard.rows.map((row, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="px-3 py-2">{row.source}</td>
                  <td className="px-3 py-2">{row.medium}</td>
                  <td className="px-3 py-2">{row.campaign}</td>
                  <td className="px-3 py-2 text-right">{row.visits}</td>
                  <td className="px-3 py-2 text-right">{row.inquiries}</td>
                  <td className="px-3 py-2 text-right">{fmtPct(row.conversionRate)}</td>
                  <td className="px-3 py-2 text-right">{fmtWon(row.expectedCpa)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-text-muted">
        참고: 현재 방문 트래킹이 없어 유입수는 의뢰수와 동일합니다. 예상 CPA는 캠페인당{" "}
        <code>₩300,000</code> 지출을 가정한 참고 지표입니다.
      </p>
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-text-strong">{value.toLocaleString("ko-KR")}</p>
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  );
}
