import { prisma } from "@/lib/prisma/client";
import { KPICharts } from "./kpi-charts";

export const dynamic = "force-dynamic";

type MonthlyCount = { month: string; count: number };

export default async function KPIPage() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Monthly inquiry counts
  const inquiries = await prisma.inquiry.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true },
  });

  const monthlyInquiries = aggregateByMonth(
    inquiries.map((i) => i.createdAt),
    twelveMonthsAgo,
  );

  // Monthly case counts
  const cases = await prisma.caseMatter.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true },
  });

  const monthlyCases = aggregateByMonth(
    cases.map((c) => c.createdAt),
    twelveMonthsAgo,
  );

  // Inquiry type distribution
  const allInquiries = await prisma.inquiry.findMany({
    select: { inquiryType: true },
  });

  const typeDistribution = Object.entries(
    allInquiries.reduce(
      (acc, i) => {
        acc[i.inquiryType] = (acc[i.inquiryType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }));

  // Status distribution
  const allCases = await prisma.caseMatter.findMany({
    select: { status: true },
  });

  const statusDistribution = Object.entries(
    allCases.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }));

  // Win rate
  const closedCases = allCases.filter((c) =>
    ["CLOSED", "CANCELLED"].includes(c.status),
  );
  const wonCases = allInquiries.filter((i) => i.inquiryType === "FOREIGNER_VISA"); // placeholder
  // Use inquiry WON status for win rate
  const allInquiriesForWin = await prisma.inquiry.findMany({
    select: { status: true },
  });
  const closedInquiries = allInquiriesForWin.filter((i) =>
    ["WON", "CLOSED"].includes(i.status),
  );
  const wonInquiries = allInquiriesForWin.filter((i) => i.status === "WON");
  const winRate =
    closedInquiries.length > 0
      ? Math.round((wonInquiries.length / closedInquiries.length) * 100)
      : 0;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold" style={{ color: "#1a3c5f" }}>
        KPI 대시보드
      </h1>
      <KPICharts
        monthlyInquiries={monthlyInquiries}
        monthlyCases={monthlyCases}
        typeDistribution={typeDistribution}
        statusDistribution={statusDistribution}
        winRate={winRate}
        totalInquiries={allInquiries.length}
        totalCases={allCases.length}
      />
    </div>
  );
}

function aggregateByMonth(
  dates: Date[],
  startFrom: Date,
): MonthlyCount[] {
  const months: MonthlyCount[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(startFrom.getFullYear(), startFrom.getMonth() + i, 1);
    if (d > now) break;
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ month: label, count: 0 });
  }

  for (const date of dates) {
    const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const entry = months.find((m) => m.month === label);
    if (entry) entry.count++;
  }

  return months;
}
