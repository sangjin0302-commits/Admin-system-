import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { listPaymentRisks } from "@/lib/services/payment-risk-service";

export const dynamic = "force-dynamic";

function riskColor(score: number): string {
  if (score >= 70) return "text-red-700 bg-red-50 border-red-200";
  if (score >= 40) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-green-700 bg-green-50 border-green-200";
}

export default async function AdminPaymentRiskPage() {
  const rows = await listPaymentRisks(100);

  const high = rows.filter((r) => r.score >= 70).length;
  const mid = rows.filter((r) => r.score >= 40 && r.score < 70).length;
  const low = rows.filter((r) => r.score < 40).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="인사이트 · 미수금 리스크"
        title="미수금 리스크 스코어"
        description="활성 사건별 결제 리스크(0-100)를 계산해 우선순위대로 정렬합니다."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="ui-kicker">고위험 (≥70)</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{high}</p>
        </Card>
        <Card className="p-4">
          <p className="ui-kicker">중위험 (40-69)</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{mid}</p>
        </Card>
        <Card className="p-4">
          <p className="ui-kicker">저위험 (&lt;40)</p>
          <p className="mt-2 text-2xl font-bold text-green-700">{low}</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/40 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">사건</th>
                <th className="px-3 py-2 text-left">의뢰인</th>
                <th className="px-3 py-2 text-center">점수</th>
                <th className="px-3 py-2 text-left">요인</th>
                <th className="px-3 py-2 text-left">권고</th>
                <th className="px-3 py-2 text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-text-muted">
                    활성 사건이 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.caseId} className="border-t border-line align-top">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-text-strong">{r.title}</div>
                      <div className="text-xs text-text-muted">
                        {r.caseNo ?? "-"} · {r.status}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{r.clientName ?? "-"}</div>
                      <div className="text-xs text-text-muted">{r.clientEmail ?? "-"}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block rounded-md border px-2 py-1 text-sm font-bold ${riskColor(r.score)}`}
                      >
                        {r.score}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <ul className="space-y-0.5 text-xs">
                        {r.factors.map((f, i) => (
                          <li key={i}>· {f}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-3 py-2 text-xs">{r.recommendation}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="rounded-md border border-line px-2 py-1 text-xs hover:bg-surface-muted"
                          data-case-id={r.caseId}
                        >
                          재촉 발송
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-line px-2 py-1 text-xs hover:bg-surface-muted"
                          data-case-id={r.caseId}
                        >
                          결제 방법 안내
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
