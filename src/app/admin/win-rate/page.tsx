import { Card } from "@/components/ui/card";
import { getHistoricalWinRate } from "@/lib/services/win-rate-prediction-service";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  FOREIGNER_VISA: "외국인 비자",
  IMMIGRATION_STAY: "체류자격",
  APOSTILLE_CONSULAR: "아포스티유/영사 인증",
  TRANSLATION_NOTARY: "번역/공증",
  GENERAL_ADMIN_CIVIL: "행정/민원",
  CORPORATE_REQUEST: "기업 의뢰",
  UNKNOWN: "미분류",
};

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function WinRatePage() {
  const stats = await getHistoricalWinRate();
  const sortedTypes = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">AI Analytics</p>
        <h2 className="mt-2 ui-page-title">수임율 예측</h2>
        <p className="mt-2 max-w-3xl text-sm text-text-muted">
          가중치 기반 휴리스틱으로 새 문의의 수임 가능성을 예측하고, 과거 데이터 기반의 실제
          수임율과 비교합니다.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">전체 수임율</h3>
        <p className="mt-3 text-3xl font-semibold tabular-nums text-text-strong">
          {formatPct(stats.overall)}
        </p>
        <p className="mt-1 text-xs text-text-muted">WON 상태 비율 (전체 문의 대비)</p>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-semibold text-text-strong">문의 유형별 수임율</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs font-semibold text-text-muted">
            <tr>
              <th className="px-5 py-3">문의 유형</th>
              <th className="px-5 py-3 text-right">수임율</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sortedTypes.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-5 py-6 text-center text-text-muted">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              sortedTypes.map(([type, rate]) => (
                <tr key={type}>
                  <td className="px-5 py-3 text-text-strong">
                    {TYPE_LABELS[type] ?? type}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatPct(rate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">예측 API 사용 방법</h3>
        <p className="mt-2 text-sm text-text-muted">
          <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
            POST /api/admin/predict-win-rate
          </code>{" "}
          에 PredictionInput JSON을 전송하면 예측 결과를 받을 수 있습니다.
        </p>
      </Card>
    </div>
  );
}
