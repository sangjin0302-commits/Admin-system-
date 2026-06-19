import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getTopLTVCustomers } from "@/lib/services/ltv-service";

export const dynamic = "force-dynamic";

const RISK_COLOR: Record<string, string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
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
        <div className="ui-kicker">Customer Analytics</div>
        <h1 className="ui-page-title">Customer Lifetime Value</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">Total LTV (Top 20)</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: "#1a3c5f" }}>
            ₩{totalLTV.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Average LTV</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: "#c9a961" }}>
            ₩{avgLTV.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Churn Distribution</div>
          <div className="mt-2 space-y-1 text-sm">
            {(["low", "medium", "high"] as const).map((r) => (
              <div key={r} className="flex justify-between">
                <span style={{ color: RISK_COLOR[r] }}>{r}</span>
                <span>{churnCounts[r] ?? 0}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Customer Count</div>
          <div className="mt-1 text-2xl font-semibold">{customers.length}</div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Top 20 Customers by Predicted LTV</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-2">#</th>
                <th className="py-2">Customer</th>
                <th className="py-2 text-right">Cases</th>
                <th className="py-2 text-right">Avg Case Value</th>
                <th className="py-2 text-right">Total Revenue</th>
                <th className="py-2 text-right">Predicted LTV</th>
                <th className="py-2 text-right">Churn</th>
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
                      {c.churnRisk}
                    </span>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    No customer revenue data yet.
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
