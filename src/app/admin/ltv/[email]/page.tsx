import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { calculateCustomerLTV } from "@/lib/services/ltv-service";

export const dynamic = "force-dynamic";

const RISK_COLOR: Record<string, string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
};

function recommendationsFor(
  churnRisk: "low" | "medium" | "high",
  caseCount: number,
): string[] {
  const recs: string[] = [];
  if (churnRisk === "high") {
    recs.push("Reach out personally within 7 days — high churn signal.");
    recs.push("Offer a complimentary consult or case review.");
  } else if (churnRisk === "medium") {
    recs.push("Send a quarterly check-in email with relevant updates.");
    recs.push("Surface a related service this customer hasn't used.");
  } else {
    recs.push("Maintain regular newsletter cadence; customer is healthy.");
  }
  if (caseCount === 1) {
    recs.push("Upsell: introduce a second matter type relevant to their case history.");
  }
  if (caseCount >= 3) {
    recs.push("Consider VIP track: dedicated advisor and faster response SLA.");
  }
  return recs;
}

export default async function CustomerLTVDetailPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  const ltv = await calculateCustomerLTV(email);
  if (!ltv) {
    notFound();
  }

  const caseHistory = await prisma.caseMatter.findMany({
    where: { inquiry: { email } },
    select: {
      id: true,
      caseNo: true,
      title: true,
      status: true,
      createdAt: true,
      closedAt: true,
      accountingMemo: {
        select: { paidAmount: true, paidAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const daysSince = Math.floor(
    (Date.now() - ltv.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const recs = recommendationsFor(ltv.churnRisk, ltv.caseCount);

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">Customer Analytics</div>
        <h1 className="ui-page-title">{ltv.name}</h1>
        <div className="text-sm text-gray-500">{ltv.email}</div>
        <Link
          href="/admin/ltv"
          className="mt-2 inline-block text-sm hover:underline"
          style={{ color: "#1a3c5f" }}
        >
          &larr; Back to LTV Rankings
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">Predicted LTV</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: "#c9a961" }}>
            ₩{ltv.predictedLTV.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: "#1a3c5f" }}>
            ₩{ltv.totalRevenue.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Avg Case Value</div>
          <div className="mt-1 text-2xl font-semibold">
            ₩{ltv.avgCaseValue.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Churn Risk</div>
          <div
            className="mt-1 text-2xl font-semibold"
            style={{ color: RISK_COLOR[ltv.churnRisk] }}
          >
            {ltv.churnRisk}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Churn Factors</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <span className="text-gray-500">Days since last activity:</span>{" "}
            <span className="font-medium">{daysSince}</span>
          </li>
          <li>
            <span className="text-gray-500">Case count:</span>{" "}
            <span className="font-medium">{ltv.caseCount}</span>
          </li>
          <li>
            <span className="text-gray-500">First contact:</span>{" "}
            <span className="font-medium">
              {ltv.firstContactDate.toISOString().slice(0, 10)}
            </span>
          </li>
          <li>
            <span className="text-gray-500">Last activity:</span>{" "}
            <span className="font-medium">
              {ltv.lastActivityDate.toISOString().slice(0, 10)}
            </span>
          </li>
          <li>
            <span className="text-gray-500">Predicted lifetime:</span>{" "}
            <span className="font-medium">{ltv.predictedLifetimeMonths} months</span>
          </li>
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Retention Recommendations</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {recs.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Case History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-2">Case No.</th>
                <th className="py-2">Title</th>
                <th className="py-2">Status</th>
                <th className="py-2">Opened</th>
                <th className="py-2 text-right">Paid Amount</th>
                <th className="py-2">Paid At</th>
              </tr>
            </thead>
            <tbody>
              {caseHistory.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2 font-mono text-xs">{c.caseNo ?? "-"}</td>
                  <td className="py-2">{c.title}</td>
                  <td className="py-2">{c.status}</td>
                  <td className="py-2">
                    {c.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="py-2 text-right">
                    {c.accountingMemo?.paidAmount
                      ? `₩${c.accountingMemo.paidAmount.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="py-2">
                    {c.accountingMemo?.paidAt
                      ? c.accountingMemo.paidAt.toISOString().slice(0, 10)
                      : "-"}
                  </td>
                </tr>
              ))}
              {caseHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No cases on record.
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
