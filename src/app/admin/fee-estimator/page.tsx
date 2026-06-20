import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getMarketBenchmark } from "@/lib/services/fee-estimator-service";
import { FeeEstimatorClient } from "./fee-estimator-client";

export const dynamic = "force-dynamic";

export default async function FeeEstimatorPage() {
  const benchmark = await getMarketBenchmark();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="수임료 계산"
        title="AI 수임료 견적기"
        description="의뢰 내용을 입력하면 AI가 카테고리를 분류하고 시장 기준에 맞춘 수임료 범위를 제안합니다."
      />
      <FeeEstimatorClient benchmark={benchmark} />
    </div>
  );
}
