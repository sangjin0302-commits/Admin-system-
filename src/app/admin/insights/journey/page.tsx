import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { computeJourneyReport, type JourneyStage } from "@/lib/services/customer-journey-service";

export const dynamic = "force-dynamic";

const CATEGORY_OPTIONS = [
  { value: "", label: "전체" },
  { value: "FOREIGNER_VISA", label: "비자·체류" },
  { value: "CIVIL_COMPLAINT", label: "행정민원" },
  { value: "UNKNOWN", label: "기타" },
];

function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}분`;
  if (h < 48) return `${h.toFixed(1)}시간`;
  return `${(h / 24).toFixed(1)}일`;
}

export default async function CustomerJourneyPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string; to?: string; category?: string }>;
}) {
  const enabled = await isFeatureEnabled("customer_journey");
  if (!enabled) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminPageHeader kicker="Insights" title="의뢰인 여정" description="기능이 비활성화되어 있습니다." />
        <Card className="p-6 text-sm text-text-muted">기능 플래그 `customer_journey`를 활성화하세요.</Card>
      </div>
    );
  }
  const sp = (await searchParams) ?? {};
  const fromDate = sp.from ? new Date(sp.from) : undefined;
  const toDate = sp.to ? new Date(sp.to) : undefined;
  const category = sp.category?.trim() || undefined;
  const report = await computeJourneyReport({ fromDate, toDate, category });

  const maxP90 = Math.max(1, ...report.stages.map((s) => s.p90Hours));
  const scale = (h: number) => Math.min(100, Math.round((h / maxP90) * 100));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AdminPageHeader
        kicker="Insights"
        title="의뢰인 여정 시각화"
        description="문의 → 응대 → 계약 → 사건 → 종결 단계별 소요시간(P50·P90)과 병목 감지."
      />

      <Card className="p-5">
        <form className="flex flex-wrap items-end gap-3 text-sm" method="get">
          <label className="flex flex-col gap-1">
            <span className="text-text-muted">시작일</span>
            <input type="date" name="from" defaultValue={sp.from ?? ""} className="rounded border px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-text-muted">종료일</span>
            <input type="date" name="to" defaultValue={sp.to ?? ""} className="rounded border px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-text-muted">카테고리</span>
            <select name="category" defaultValue={sp.category ?? ""} className="rounded border px-2 py-1">
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded bg-primary px-3 py-1.5 text-white">
            조회
          </button>
        </form>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">단계별 소요 시간</h2>
          <p className="text-xs text-text-muted">
            총 {report.totalClients}명 · {new Date(report.fromDate).toLocaleDateString("ko-KR")} ~{" "}
            {new Date(report.toDate).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <div className="space-y-4">
          {report.stages.map((s) => {
            const isBottleneck = s.stage === report.bottleneckStage;
            return (
              <div key={s.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className={isBottleneck ? "font-semibold text-red-600" : "font-medium"}>
                    {s.label}
                    {isBottleneck ? " · 병목" : ""}
                  </span>
                  <span className="text-xs text-text-muted">
                    표본 {s.sampleCount} · P50 {fmtHours(s.medianHours)} · P90 {fmtHours(s.p90Hours)}
                  </span>
                </div>
                <svg viewBox="0 0 100 8" className="h-3 w-full" preserveAspectRatio="none">
                  <rect x={0} y={2} width={100} height={4} fill="#eee" rx={2} />
                  <rect
                    x={0}
                    y={2}
                    width={scale(s.p90Hours)}
                    height={4}
                    fill={isBottleneck ? "#dc2626" : "#9ca3af"}
                    rx={2}
                  />
                  <rect
                    x={0}
                    y={2}
                    width={scale(s.medianHours)}
                    height={4}
                    fill={isBottleneck ? "#f87171" : "#1f2937"}
                    rx={2}
                  />
                </svg>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold">개선 제안</h2>
        {report.suggestions.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">뚜렷한 병목이 감지되지 않았습니다.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {report.suggestions.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-text-muted">
        <Link href="/admin/insights" className="underline">
          ← 인사이트 대시보드
        </Link>
      </p>
    </div>
  );
}

// TS: JourneyStage 재수출 (편집기 IntelliSense 편의)
export type { JourneyStage };
