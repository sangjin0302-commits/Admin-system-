/**
 * 접수 폼 퍼널 분석 대시보드.
 * 다단계 접수 폼의 단계별 완료율과 이탈률을 시각화.
 * Feature flag: `intake_funnel_tracking`
 */

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getFunnelCounters } from "@/lib/services/intake-funnel-service";

export const dynamic = "force-dynamic";

const STEP_LABELS = [
  "업무 분야 선택",
  "연락처 및 상담 정보",
  "분야별 상세 질문",
  "사건 개요 및 서류",
  "동의 및 제출",
];

export default async function IntakeFunnelPage() {
  const enabled = await isFeatureEnabled("intake_funnel_tracking").catch(() => true);
  if (!enabled) {
    return (
      <Card className="p-6">
        <p className="text-sm text-text-muted">접수 퍼널 트래킹이 비활성화되어 있습니다.</p>
      </Card>
    );
  }

  const counters = await getFunnelCounters();
  const totalSteps = (counters.totalSteps as number) || 5;

  const steps = Array.from({ length: totalSteps }, (_, i) => {
    const stepNum = i + 1;
    return {
      step: stepNum,
      label: STEP_LABELS[i] ?? `Step ${stepNum}`,
      count: (counters[`step_${stepNum}`] as number) ?? 0,
    };
  });

  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Analytics"
        title="접수 폼 퍼널 분석"
        description="다단계 접수 폼의 단계별 도달률과 이탈 지점을 확인합니다."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-text-muted">Step 1 진입</p>
          <p className="text-2xl font-bold">{steps[0]?.count ?? 0}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-text-muted">최종 제출 (Step {totalSteps})</p>
          <p className="text-2xl font-bold">{steps[totalSteps - 1]?.count ?? 0}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-text-muted">전체 전환율</p>
          <p className="text-2xl font-bold">
            {steps[0]?.count
              ? `${Math.round(((steps[totalSteps - 1]?.count ?? 0) / steps[0].count) * 100)}%`
              : "-"}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-text-muted">최대 이탈 구간</p>
          <p className="text-2xl font-bold">
            {(() => {
              let maxDrop = 0;
              let maxDropStep = "-";
              for (let i = 0; i < steps.length - 1; i++) {
                const drop = steps[i].count - steps[i + 1].count;
                if (drop > maxDrop) {
                  maxDrop = drop;
                  maxDropStep = `Step ${i + 1}→${i + 2}`;
                }
              }
              return maxDropStep;
            })()}
          </p>
        </Card>
      </div>

      {/* Funnel bars */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-muted">단계별 퍼널</h2>
        <div className="space-y-3">
          {steps.map((s, i) => {
            const pct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
            const prevCount = i > 0 ? steps[i - 1].count : null;
            const dropOff =
              prevCount && prevCount > 0
                ? `-${Math.round(((prevCount - s.count) / prevCount) * 100)}%`
                : null;

            return (
              <div key={s.step}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">
                    Step {s.step}: {s.label}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{s.count.toLocaleString()}</span>
                    {dropOff && (
                      <span className="text-red-500">{dropOff}</span>
                    )}
                  </span>
                </div>
                <div className="h-6 w-full rounded bg-gray-100">
                  <div
                    className="h-6 rounded bg-blue-500 transition-all"
                    style={{ width: `${pct}%`, minWidth: s.count > 0 ? "2px" : "0" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Step-to-step conversion table */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-muted">단계 간 전환율</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-text-muted">
                <th className="pb-2">구간</th>
                <th className="pb-2 text-right">이전</th>
                <th className="pb-2 text-right">다음</th>
                <th className="pb-2 text-right">전환율</th>
                <th className="pb-2 text-right">이탈</th>
              </tr>
            </thead>
            <tbody>
              {steps.slice(0, -1).map((s, i) => {
                const next = steps[i + 1];
                const rate = s.count > 0 ? Math.round((next.count / s.count) * 100) : 0;
                const dropped = s.count - next.count;
                return (
                  <tr key={s.step} className="border-b last:border-0">
                    <td className="py-2">
                      Step {s.step} → {next.step}
                    </td>
                    <td className="py-2 text-right font-mono">{s.count.toLocaleString()}</td>
                    <td className="py-2 text-right font-mono">{next.count.toLocaleString()}</td>
                    <td className="py-2 text-right font-mono">{rate}%</td>
                    <td className="py-2 text-right font-mono text-red-500">
                      {dropped > 0 ? `-${dropped.toLocaleString()}` : "0"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
