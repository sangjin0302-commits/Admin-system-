import { Card } from "@/components/ui/card";
import { forecastRevenue } from "@/lib/services/revenue-prediction-service";

import { ForecastChart } from "./forecast-chart";

export const dynamic = "force-dynamic";

export default async function RevenueForecastPage() {
  const result = await forecastRevenue(6);

  const totalHistorical = result.historical.reduce(
    (a, p) => a + p.actualRevenue,
    0,
  );
  const totalForecast = result.forecast.reduce(
    (a, p) => a + (p.predictedRevenue ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">경영 분석</div>
        <h1 className="ui-page-title">매출 예측</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-500">최근 12개월 실적</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: "#1a3c5f" }}>
            ₩{totalHistorical.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">향후 6개월 예측</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: "#c9a961" }}>
            ₩{totalForecast.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">예측 모델 / 신뢰도</div>
          <div className="mt-1 text-2xl font-semibold">
            {result.modelType}
          </div>
          <div className="text-sm text-gray-600">
            신뢰도 {(result.confidence * 100).toFixed(0)}%
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">6개월 매출 예측</h2>
        <ForecastChart forecast={result} />
      </Card>
    </div>
  );
}
