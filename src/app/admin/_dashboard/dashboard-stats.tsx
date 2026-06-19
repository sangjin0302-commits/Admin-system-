import { DashboardMetric } from "@/components/admin/dashboard-shared";

type Props = {
  inquiriesCount: number;
  quoteCount: number;
  contractDraftCount: number;
  caseCount: number;
  checklistCoverageCount: number;
  checklistAvgPercent: number;
  checklistLowReadinessCount: number;
  operationalHealthScore: number;
  operationalHealthDescription: string;
};

export function DashboardStats({
  inquiriesCount,
  quoteCount,
  contractDraftCount,
  caseCount,
  checklistCoverageCount,
  checklistAvgPercent,
  checklistLowReadinessCount,
  operationalHealthScore,
  operationalHealthDescription
}: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      <DashboardMetric label="문의" value={inquiriesCount} description="누적 접수와 사건 후보" />
      <DashboardMetric label="견적" value={quoteCount} description="생성된 견적 및 후속 흐름" />
      <DashboardMetric label="계약 초안" value={contractDraftCount} description="계약 문안 및 정리 단계" />
      <DashboardMetric label="사건" value={caseCount} description="실제 진행 중인 사건 레코드" />
      <DashboardMetric label="체크리스트 적용" value={checklistCoverageCount} description="즉시 조치 체크를 적용 중인 건" />
      <DashboardMetric label="평균 준비도" value={checklistAvgPercent} description="실행 체크리스트 평균 완료율(%)" />
      <DashboardMetric label="준비도 낮음" value={checklistLowReadinessCount} description="완료율 40% 이하 우선 점검 건" />
      <DashboardMetric
        label="운영 건전도"
        value={operationalHealthScore}
        description={operationalHealthDescription}
      />
    </div>
  );
}
