import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

export default async function FeeTrackingPage() {
  const enabled = await isFeatureEnabled("case_fee_tracking");
  if (!enabled) return notFound();

  // Fetch all cases with fee info from SiteSetting
  const cases = await prisma.caseMatter.findMany({
    select: {
      id: true,
      caseNo: true,
      title: true,
      matterType: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Load fee data from SiteSetting
  const feeSetting = await prisma.siteSetting.findUnique({
    where: { key: "fee_tracking_data" },
  });
  const feeData: Record<string, { totalFee: number; payments: { amount: number; date: string; note: string }[] }> = feeSetting?.value ? JSON.parse(feeSetting.value) : {};

  // Calculate KPIs
  let totalFees = 0;
  let totalCollected = 0;
  const rows = cases.map((c) => {
    const info = feeData[c.id] || { totalFee: 0, payments: [] };
    const paid = info.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
    totalFees += info.totalFee;
    totalCollected += paid;
    return {
      ...c,
      totalFee: info.totalFee,
      paid,
      balance: info.totalFee - paid,
      status: info.totalFee === 0 ? "미설정" : paid >= info.totalFee ? "수금완료" : "미수금",
    };
  });
  const outstanding = totalFees - totalCollected;
  const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0;

  const fmt = (n: number) => n.toLocaleString("ko-KR");

  return (
    <div className="space-y-6">
      <AdminPageHeader kicker="재무" title="수임료 수금 관리" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "총 수임료", value: `₩${fmt(totalFees)}` },
          { label: "수금완료", value: `₩${fmt(totalCollected)}` },
          { label: "미수금", value: `₩${fmt(outstanding)}` },
          { label: "수금률", value: `${collectionRate}%` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">사건번호</th>
              <th className="px-4 py-3 text-left font-medium">사건명</th>
              <th className="px-4 py-3 text-right font-medium">수임료</th>
              <th className="px-4 py-3 text-right font-medium">입금액</th>
              <th className="px-4 py-3 text-right font-medium">잔액</th>
              <th className="px-4 py-3 text-center font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{r.caseNo || "-"}</td>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3 text-right">₩{fmt(r.totalFee)}</td>
                <td className="px-4 py-3 text-right">₩{fmt(r.paid)}</td>
                <td className="px-4 py-3 text-right">₩{fmt(r.balance)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "수금완료" ? "bg-green-100 text-green-700" : r.status === "미수금" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
