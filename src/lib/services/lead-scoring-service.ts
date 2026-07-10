import { prisma } from "@/lib/prisma/client";
import { InquiryStatus } from "@generated/prisma-client/client";

export type ChannelScore = {
  channel: string;
  inquiries: number;
  wonCount: number;
  wonRate: number;
  avgDaysToWon: number;
};

export type KeywordScore = {
  keyword: string;
  inquiries: number;
  wonCount: number;
  wonRate: number;
};

export type LeadScoreReport = {
  channels: ChannelScore[];
  keywords: KeywordScore[];
  overall: {
    totalInquiries: number;
    wonRate: number;
  };
};

export async function getLeadScores(): Promise<LeadScoreReport> {
  const inquiries = await prisma.inquiry.findMany({
    select: {
      id: true,
      status: true,
      intakeChannel: true,
      createdAt: true,
      updatedAt: true,
      caseMatters: {
        select: {
          category: true,
          matterType: true,
        },
      },
    },
  });

  // --- Overall ---
  const totalInquiries = inquiries.length;
  const totalWon = inquiries.filter((i) => i.status === InquiryStatus.WON).length;
  const wonRate = totalInquiries > 0 ? Math.round((totalWon / totalInquiries) * 100) : 0;

  // --- Channel scores ---
  const channelMap = new Map<string, { total: number; won: number; daysSum: number }>();
  for (const inq of inquiries) {
    const ch = inq.intakeChannel || "미지정";
    const entry = channelMap.get(ch) ?? { total: 0, won: 0, daysSum: 0 };
    entry.total++;
    if (inq.status === InquiryStatus.WON) {
      entry.won++;
      const days = Math.max(0, Math.round((inq.updatedAt.getTime() - inq.createdAt.getTime()) / 86_400_000));
      entry.daysSum += days;
    }
    channelMap.set(ch, entry);
  }
  const channels: ChannelScore[] = [...channelMap.entries()]
    .map(([channel, v]) => ({
      channel,
      inquiries: v.total,
      wonCount: v.won,
      wonRate: v.total > 0 ? Math.round((v.won / v.total) * 100) : 0,
      avgDaysToWon: v.won > 0 ? Math.round(v.daysSum / v.won) : 0,
    }))
    .sort((a, b) => b.wonRate - a.wonRate);

  // --- Keyword (category) scores ---
  const kwMap = new Map<string, { total: number; won: number }>();
  for (const inq of inquiries) {
    const kw = inq.caseMatters?.[0]?.category ?? inq.caseMatters?.[0]?.matterType ?? "미분류";
    const entry = kwMap.get(kw) ?? { total: 0, won: 0 };
    entry.total++;
    if (inq.status === InquiryStatus.WON) entry.won++;
    kwMap.set(kw, entry);
  }
  const keywords: KeywordScore[] = [...kwMap.entries()]
    .map(([keyword, v]) => ({
      keyword,
      inquiries: v.total,
      wonCount: v.won,
      wonRate: v.total > 0 ? Math.round((v.won / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.wonRate - a.wonRate);

  return { channels, keywords, overall: { totalInquiries, wonRate } };
}
