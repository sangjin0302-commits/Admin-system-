import Link from "next/link";

import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdminPageSession } from "@/lib/auth/session";
import { getAdminDashboardSnapshot } from "@/lib/dashboard/service";
import { getLatestDemandForecastSummary } from "@/lib/forecasting/service";
import { inquiryTypeLabels, type InquiryType } from "@/types/inquiry";

export const dynamic = "force-dynamic";

export default async function AdminForecastPage() {
  const session = await requireAdminPageSession("/admin/forecast", "STAFF");
  const [snapshot, forecastSummary] = await Promise.all([
    getAdminDashboardSnapshot(),
    getLatestDemandForecastSummary()
  ]);

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="ui-kicker">Forecast</p>
            <h2 className="mt-2 ui-page-title">예측 / 운영 인사이트</h2>
            <p className="ui-section-copy mt-2">
              접수 현황을 유지한 채, 최근 KPI와 주간 수요 예측 데이터를 별도 페이지에서 검토합니다.
            </p>
          </div>
          <Link href="/admin/inquiries" className="ui-toolbar-button px-4 py-2 text-sm">
            접수 내역으로 돌아가기
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="총 접수" value={snapshot.kpis.totalInquiries} />
        <StatCard label="생성된 견적" value={snapshot.kpis.quotesCreated} />
        <StatCard label="수임 건수" value={snapshot.kpis.acceptedQuotes} />
        <StatCard label="종결 사건" value={snapshot.kpis.closedCases} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <h3 className="ui-section-title">문의 유형 분포</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {snapshot.inquiryTypeBreakdown.length > 0 ? (
              snapshot.inquiryTypeBreakdown.map((item) => {
                const inquiryType = item.inquiryType as InquiryType;
                return (
                  <Badge key={item.inquiryType}>
                    {inquiryTypeLabels[inquiryType]?.ko ?? item.inquiryType} {item.count}
                  </Badge>
                );
              })
            ) : (
              <p className="text-sm text-text-muted">아직 집계된 문의 유형 데이터가 없습니다.</p>
            )}
          </div>

          <div className="mt-6 grid gap-3">
            {snapshot.recentTrend.map((item) => (
              <Card key={item.date} muted className="p-4">
                <div className="flex items-center justify-between gap-4 text-sm text-text">
                  <span>{item.date}</span>
                  <span>접수 {item.inquiries}</span>
                  <span>종결 {item.closedCases}</span>
                  <span>보완/리뷰 {item.reviewRequests}</span>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="ui-section-title">최신 예측 요약</h3>
          <div className="mt-5 grid gap-3 text-sm text-text">
            <InfoItem label="주간 데이터셋 행 수" value={String(forecastSummary.datasetCount)} />
            <InfoItem
              label="최신 데이터 주차"
              value={forecastSummary.latestDatasetWeekStart?.toISOString().slice(0, 10) ?? "-"}
            />
            <InfoItem
              label="최신 모델"
              value={forecastSummary.latestRun?.modelName ?? "아직 예측 실행 없음"}
            />
            <InfoItem
              label="예측 대상"
              value={forecastSummary.latestRun?.targetCategory ?? "-"}
            />
          </div>

          <div className="mt-5 grid gap-3">
            {forecastSummary.latestRun?.points.length ? (
              forecastSummary.latestRun.points.map((point) => (
                <Card key={point.id} muted className="p-4">
                  <p className="text-xs text-text-muted">
                    {point.targetWeekStart.toISOString().slice(0, 10)}
                  </p>
                  <p className="mt-2 text-sm text-text">
                    예측값 {point.predictedValue}
                    {point.actualValue !== null ? ` / 실제값 ${point.actualValue}` : ""}
                  </p>
                </Card>
              ))
            ) : (
              <p className="text-sm text-text-muted">
                아직 저장된 수요 예측 결과가 없습니다. 배치 실행 후 이 화면에서 바로 검토할 수 있습니다.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="ui-stat-card p-5">
      <p className="ui-kicker">Metric</p>
      <p className="mt-2 text-sm text-text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-text">{value}</p>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Card muted className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm text-text">{value}</p>
    </Card>
  );
}
