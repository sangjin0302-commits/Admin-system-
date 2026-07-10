import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  computeAccuracy,
  listRecentPredictions,
} from "@/lib/services/ai-prediction-tracker";

export const dynamic = "force-dynamic";

export default async function AIAccuracyPage() {
  const enabled = await isFeatureEnabled("ai_prediction_accuracy");

  if (!enabled) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          kicker="AI"
          title="AI 결과 예측 정확도"
          description="ai_prediction_accuracy 플래그가 꺼져 있습니다."
        />
      </div>
    );
  }

  const [summary, recent] = await Promise.all([computeAccuracy(), listRecentPredictions(50)]);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI"
        title="AI 결과 예측 정확도"
        description="사건 종결 시 실제 결과와 예측 신뢰도를 비교해 정확도를 산출합니다."
      />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">전체 요약</h2>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <KPI label="총 예측(종결)" value={summary.predictions.toLocaleString()} />
          <KPI label="정답 수" value={summary.correct.toLocaleString()} />
          <KPI label="정확도" value={pct(summary.accuracy)} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">신뢰도 구간별 정확도</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left">신뢰도 구간</th>
              <th className="py-2 text-right">예측 수</th>
              <th className="py-2 text-right">정답 수</th>
              <th className="py-2 text-right">정확도</th>
            </tr>
          </thead>
          <tbody>
            {summary.byRange.map((r) => (
              <tr key={r.range} className="border-b border-border/50">
                <td className="py-2">{r.range}</td>
                <td className="py-2 text-right">{r.predictions}</td>
                <td className="py-2 text-right">{r.correct}</td>
                <td className="py-2 text-right">{pct(r.accuracy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">최근 예측 (최대 50)</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left">사건 ID</th>
              <th className="py-2 text-right">예측 신뢰도</th>
              <th className="py-2 text-right">실제 결과</th>
              <th className="py-2 text-right">예측 시각</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.caseId} className="border-b border-border/50">
                <td className="py-2 font-mono text-xs">{r.caseId}</td>
                <td className="py-2 text-right">{pct(r.predictedConfidence)}</td>
                <td className="py-2 text-right">{r.actualOutcome ?? "—"}</td>
                <td className="py-2 text-right text-xs">
                  {new Date(r.predictedAt).toLocaleString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-text-strong">{value}</div>
    </div>
  );
}
