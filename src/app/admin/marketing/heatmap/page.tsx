import Link from "next/link";

import { getInquiryHeatmap } from "@/lib/services/inquiry-heatmap-service";

export const dynamic = "force-dynamic";

const RANGE_OPTIONS = [7, 30, 90];
const DOW_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function normalizeDays(raw: string | undefined): number {
  const n = raw ? parseInt(raw, 10) : 30;
  if (!Number.isFinite(n)) return 30;
  if (RANGE_OPTIONS.includes(n)) return n;
  return 30;
}

function colorFor(value: number, max: number, palette: "blue" | "green"): string {
  if (max <= 0 || value <= 0) return "rgba(0,0,0,0.03)";
  const ratio = Math.min(1, value / max);
  const alpha = 0.12 + ratio * 0.78;
  if (palette === "blue") return `rgba(37, 99, 235, ${alpha.toFixed(3)})`;
  return `rgba(22, 163, 74, ${alpha.toFixed(3)})`;
}

function HeatmapSvg({
  grid,
  palette,
  title,
}: {
  grid: number[][];
  palette: "blue" | "green";
  title: string;
}) {
  const cellW = 22;
  const cellH = 22;
  const leftPad = 32;
  const topPad = 22;
  const width = leftPad + cellW * 24 + 4;
  const height = topPad + cellH * 7 + 4;
  const max = grid.reduce((m, row) => Math.max(m, ...row), 0);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="ui-kicker mb-2">{title}</p>
      <div className="overflow-x-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={title}
        >
          {Array.from({ length: 24 }).map((_, h) => (
            <text
              key={`h-${h}`}
              x={leftPad + h * cellW + cellW / 2}
              y={topPad - 8}
              fontSize={9}
              textAnchor="middle"
              fill="currentColor"
              opacity={0.6}
            >
              {h}
            </text>
          ))}
          {DOW_LABELS.map((label, d) => (
            <text
              key={`d-${d}`}
              x={leftPad - 6}
              y={topPad + d * cellH + cellH / 2 + 3}
              fontSize={10}
              textAnchor="end"
              fill="currentColor"
              opacity={0.7}
            >
              {label}
            </text>
          ))}
          {grid.map((row, d) =>
            row.map((count, h) => (
              <rect
                key={`c-${d}-${h}`}
                x={leftPad + h * cellW}
                y={topPad + d * cellH}
                width={cellW - 2}
                height={cellH - 2}
                rx={3}
                ry={3}
                fill={colorFor(count, max, palette)}
              >
                <title>{`${DOW_LABELS[d]} ${h.toString().padStart(2, "0")}시 · ${count}건`}</title>
              </rect>
            ))
          )}
        </svg>
      </div>
      <p className="mt-2 text-xs text-text-muted">최대 셀 값: {max}건</p>
    </div>
  );
}

export default async function AdminHeatmapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const daysRaw = Array.isArray(params.days) ? params.days[0] : params.days;
  const days = normalizeDays(daysRaw);
  const data = await getInquiryHeatmap(days);

  const topHours = data.topInflowHours
    .filter((h) => h.count > 0)
    .map((h) => `${h.hour.toString().padStart(2, "0")}시`)
    .join(", ");

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">마케팅 · 유입 분석</p>
          <h2 className="mt-2 text-xl font-semibold text-text-strong">
            의뢰 소스 히트맵 (요일 × 시간)
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            요일과 시간대별로 의뢰 유입/전환(WON) 분포를 확인합니다. (KST 기준)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r}
              href={`/admin/marketing/heatmap?days=${r}`}
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="ui-kicker">기간 총 유입</p>
          <p className="mt-2 text-2xl font-semibold text-text-strong">
            {data.totals.inflow.toLocaleString("ko-KR")}건
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="ui-kicker">기간 총 전환 (WON)</p>
          <p className="mt-2 text-2xl font-semibold text-text-strong">
            {data.totals.conversion.toLocaleString("ko-KR")}건
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <HeatmapSvg grid={data.inflow} palette="blue" title="유입 (createdAt)" />
        <HeatmapSvg grid={data.conversion} palette="green" title="전환 (WON)" />
      </div>

      <div className="mt-6 rounded-xl border border-line bg-surface-muted/40 p-4 text-sm">
        <p className="ui-kicker">인사이트</p>
        <p className="mt-2 text-text-strong">
          광고 시작 최적 시간: {topHours || "데이터 부족"}
        </p>
      </div>
    </section>
  );
}
