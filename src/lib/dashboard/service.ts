import { prisma } from "@/lib/prisma/client";

export type AdminDashboardSnapshot = {
  kpis: {
    totalInquiries: number;
    quotesCreated: number;
    acceptedQuotes: number;
    casesCreated: number;
    closedCases: number;
    reviewRequests: number;
    reviewCompleted: number;
    supplementRequests: number;
  };
  inquiryTypeBreakdown: Array<{
    inquiryType: string;
    count: number;
  }>;
  recentTrend: Array<{
    date: string;
    inquiries: number;
    closedCases: number;
    reviewRequests: number;
  }>;
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createRecentDays(days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: days }).map((_, index) => {
    const value = new Date(today);
    value.setDate(today.getDate() - (days - index - 1));
    return value;
  });
}

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const [inquiries, quotes, cases, followUps, supplements] = await Promise.all([
    prisma.inquiry.findMany({
      select: {
        createdAt: true,
        inquiryType: true
      }
    }),
    prisma.quote.findMany({
      select: {
        createdAt: true,
        status: true
      }
    }),
    prisma.caseRecord.findMany({
      select: {
        createdAt: true,
        currentStage: true,
        closedAt: true
      }
    }),
    prisma.followUpAction.findMany({
      select: {
        createdAt: true,
        type: true,
        status: true
      }
    }),
    prisma.supplementRequest.findMany({
      select: { id: true }
    })
  ]);

  const breakdownMap = new Map<string, number>();
  for (const inquiry of inquiries) {
    breakdownMap.set(inquiry.inquiryType, (breakdownMap.get(inquiry.inquiryType) ?? 0) + 1);
  }

  const recentDays = createRecentDays(7);

  return {
    kpis: {
      totalInquiries: inquiries.length,
      quotesCreated: quotes.length,
      acceptedQuotes: quotes.filter((quote) => quote.status === "ACCEPTED").length,
      casesCreated: cases.length,
      closedCases: cases.filter((record) => record.currentStage === "COMPLETED" || record.currentStage === "CLOSED").length,
      reviewRequests: followUps.filter((action) => action.type === "REVIEW_REQUEST").length,
      reviewCompleted: followUps.filter(
        (action) => action.type === "REVIEW_REQUEST" && action.status === "COMPLETED"
      ).length,
      supplementRequests: supplements.length
    },
    inquiryTypeBreakdown: Array.from(breakdownMap.entries())
      .map(([inquiryType, count]) => ({ inquiryType, count }))
      .sort((left, right) => right.count - left.count),
    recentTrend: recentDays.map((date) => {
      const key = dayKey(date);
      return {
        date: key,
        inquiries: inquiries.filter((item) => dayKey(item.createdAt) === key).length,
        closedCases: cases.filter((item) => item.closedAt && dayKey(item.closedAt) === key).length,
        reviewRequests: followUps.filter(
          (item) => item.type === "REVIEW_REQUEST" && dayKey(item.createdAt) === key
        ).length
      };
    })
  };
}
