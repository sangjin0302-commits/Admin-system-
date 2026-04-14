import Link from "next/link";

import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { WorkQueuePanel } from "@/components/admin/work-queue-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdminPageSession } from "@/lib/auth/session";
import { getLatestDemandForecastSummary } from "@/lib/forecasting/service";
import { listInquiries } from "@/lib/services/inquiry-service";
import { getWorkQueueSnapshot } from "@/lib/work-queue/service";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const session = await requireAdminPageSession("/admin", "STAFF");
  const [inquiries, workQueue, forecastSummary] = await Promise.all([
    listInquiries(),
    getWorkQueueSnapshot(),
    getLatestDemandForecastSummary()
  ]);

  const total = inquiries.length;
  const consultation = inquiries.filter(
    (item) => item.status === "CONSULTATION_REQUIRED" || item.status === "WAITING_CONSULTATION"
  ).length;
  const quotePending = inquiries.filter(
    (item) => item.status === "QUOTE_DRAFTED" || item.status === "QUOTE_SENT"
  ).length;
  const won = inquiries.filter((item) => item.status === "WON").length;

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Admin Home</p>
            <h2 className="mt-2 ui-page-title">운영 대시보드</h2>
            <p className="mt-2 text-sm text-text-muted">
              상담, 견적, 사건, 보완, 기한 상태를 기준으로 오늘 처리할 작업을 한 번에 확인할 수
              있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/inquiries"
              className="inline-flex items-center rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-text-strong hover:bg-surface-muted"
            >
              문의 목록으로 이동
            </Link>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryBox label="전체 문의" value={total} tone="default" />
          <SummaryBox label="상담 대기" value={consultation} tone="warning" />
          <SummaryBox label="견적 후속" value={quotePending} tone="info" />
          <SummaryBox label="수임 진행" value={won} tone="success" />
        </div>
      </Card>

      <WorkQueuePanel snapshot={workQueue} />

      <Card className="p-6">
        <div className="flex flex-col gap-3">
          <div>
            <p className="ui-kicker">Demand Forecast Pilot</p>
            <h3 className="mt-2 text-lg font-semibold text-text-strong">주간 수요 예측 레이어</h3>
            <p className="mt-2 text-sm text-text-muted">
              내부 문의/수임 흐름에 외부 지표와 이벤트 플래그를 결합해 TimesFM 배치 예측을
              저장하는 파일럿 영역입니다.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <SummaryBox label="주간 데이터셋" value={forecastSummary.datasetCount} tone="info" />
            <div className="rounded-md border border-line bg-surface px-3 py-2">
              <p className="text-xs text-text-muted">최근 데이터셋 기준 주</p>
              <p className="mt-1 text-sm font-semibold text-text-strong">
                {forecastSummary.latestDatasetWeekStart
                  ? forecastSummary.latestDatasetWeekStart.toISOString().slice(0, 10)
                  : "미생성"}
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-2">
              <p className="text-xs text-text-muted">최근 예측 실행</p>
              <p className="mt-1 text-sm font-semibold text-text-strong">
                {forecastSummary.latestRun
                  ? `${forecastSummary.latestRun.targetCategory} / ${forecastSummary.latestRun.targetMetric}`
                  : "샘플 또는 배치 미생성"}
              </p>
            </div>
          </div>

          {forecastSummary.latestRun ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {forecastSummary.latestRun.points.map((point) => (
                <div
                  key={point.id}
                  className="rounded-md border border-line bg-surface-muted px-3 py-2"
                >
                  <p className="text-xs text-text-muted">
                    {point.targetWeekStart.toISOString().slice(0, 10)}
                  </p>
                  <p className="mt-1 text-base font-semibold text-text-strong">
                    {Math.round(point.predictedValue)}건 예상
                  </p>
                  <p className="text-xs text-text-muted">
                    {point.lowerBound != null && point.upperBound != null
                      ? `${Math.round(point.lowerBound)} ~ ${Math.round(point.upperBound)}`
                      : "구간 미기록"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              아직 예측 결과가 없습니다. `npm run forecast:sync`로 주간 데이터셋을 만든 뒤
              TimesFM 배치 결과를 import하면 이 영역에 예측 요약이 표시됩니다.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function SummaryBox({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "default" | "warning" | "info" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "info"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2">
      <p className="text-xs text-text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-lg font-semibold text-text-strong">{value}</p>
        <Badge className={toneClass}>{label}</Badge>
      </div>
    </div>
  );
}
