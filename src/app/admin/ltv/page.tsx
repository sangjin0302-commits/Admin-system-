import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getTopLTVCustomers } from "@/lib/services/ltv-service";

export const dynamic = "force-dynamic";

const RISK_COLOR: Record<string, string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
};

const RISK_LABEL: Record<string, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

export default async function LTVPage() {
  const customers = await getTopLTVCustomers(20);

  const totalLTV = customers.reduce((a, c) => a + c.predictedLTV, 0);
  const avgLTV =
    customers.length > 0 ? Math.round(totalLTV / customers.length) : 0;

  const churnCounts = customers.reduce(
    (acc, c) => {
      acc[c.churnRisk] = (acc[c.churnRisk] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">의뢰인 분석</div>
        <h1 className="ui-page-title">고객 생애가치</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">생애가치 합계 (상위 20명)</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: "#1a3c5f" }}>
            ₩{totalLTV.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">평균 생애가치</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: "#c9a961" }}>
            ₩{avgLTV.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">이탈 위험 분포</div>
          <div className="mt-2 space-y-1 text-sm">
            {(["low", "medium", "high"] as const).map((r) => (
              <div key={r} className="flex justify-between">
                <span style={{ color: RISK_COLOR[r] }}>{RISK_LABEL[r]}</span>
                <span>{churnCounts[r] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">의뢰인 수</div>
          <div className="mt-1 text-2xl font-semibold">{customers.length}</div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">예측 생애가치 상위 20명</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-2">#</th>
                <th className="py-2">의뢰인</th>
                <th className="py-2 text-right">사건 수</th>
                <th className="py-2 text-right">평균 사건 금액</th>
                <th className="py-2 text-right">총 매출</th>
                <th className="py-2 text-right">예측 생애가치</th>
                <th className="py-2 text-right">이탈 위험</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, idx) => (
                <tr key={c.email} className="border-b hover:bg-gray-50">
                  <td className="py-2">{idx + 1}</td>
                  <td className="py-2">
                    <Link
                      href={`/admin/ltv/${encodeURIComponent(c.email)}`}
                      className="font-medium hover:underline"
                      style={{ color: "#1a3c5f" }}
                    >
                      {c.name}
                    </Link>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </td>
                  <td className="py-2 text-right">{c.caseCount}</td>
                  <td className="py-2 text-right">
                    ₩{c.avgCaseValue.toLocaleString()}
                  </td>
                  <td className="py-2 text-right">
                    ₩{c.totalRevenue.toLocaleString()}
                  </td>
                  <td
                    className="py-2 text-right font-semibold"
                    style={{ color: "#c9a961" }}
                  >
                    ₩{c.predictedLTV.toLocaleString()}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className="rounded px-2 py-0.5 text-xs font-medium"
                      style={{
                        color: RISK_COLOR[c.churnRisk],
                        backgroundColor: `${RISK_COLOR[c.churnRisk]}1a`,
                      }}
                    >
                      {RISK_LABEL[c.churnRisk] ?? c.churnRisk}
                    </span>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    아직 의뢰인 매출 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
