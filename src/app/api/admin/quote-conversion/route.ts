import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { InquiryStatus } from "@generated/prisma-client/client";

export const dynamic = "force-dynamic";

const FEE_RANGES = [
  { label: "50만 이하", min: 0, max: 500_000 },
  { label: "50~100만", min: 500_001, max: 1_000_000 },
  { label: "100~300만", min: 1_000_001, max: 3_000_000 },
  { label: "300만 초과", min: 3_000_001, max: Infinity },
];

export async function GET() {
  if (!(await isFeatureEnabled("quote_conversion_tracking"))) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  const quoteStatuses = [
    InquiryStatus.QUOTE_DRAFTED,
    InquiryStatus.QUOTE_PENDING,
    InquiryStatus.QUOTE_SENT,
    InquiryStatus.WON,
  ];

  const inquiries = await prisma.inquiry.findMany({
    where: {
      OR: [
        { status: { in: quoteStatuses } },
        { quotes: { some: {} } },
      ],
    },
    select: {
      id: true,
      status: true,
      inquiryType: true,
      quotes: {
        select: { totalMin: true, totalMax: true, status: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const totalQuoted = inquiries.length;
  const wonCount = inquiries.filter((i) => i.status === InquiryStatus.WON).length;
  const conversionRate = totalQuoted > 0 ? ((wonCount / totalQuoted) * 100) : 0;
  const pendingCount = inquiries.filter((i) =>
    ([InquiryStatus.QUOTE_PENDING, InquiryStatus.QUOTE_SENT, InquiryStatus.QUOTE_DRAFTED] as string[]).includes(i.status)
  ).length;

  // By type
  const byType: Record<string, { total: number; won: number; rate: number }> = {};
  for (const inq of inquiries) {
    const t = inq.inquiryType ?? "UNKNOWN";
    if (!byType[t]) byType[t] = { total: 0, won: 0, rate: 0 };
    byType[t].total++;
    if (inq.status === InquiryStatus.WON) byType[t].won++;
  }
  for (const v of Object.values(byType)) {
    v.rate = v.total > 0 ? (v.won / v.total) * 100 : 0;
  }

  // By fee range
  const byFeeRange = FEE_RANGES.map((r) => ({ label: r.label, total: 0, won: 0, rate: 0 }));
  for (const inq of inquiries) {
    const fee = inq.quotes[0]?.totalMin;
    if (fee == null) continue;
    const idx = FEE_RANGES.findIndex((b) => fee >= b.min && fee <= b.max);
    if (idx < 0) continue;
    byFeeRange[idx].total++;
    if (inq.status === InquiryStatus.WON) byFeeRange[idx].won++;
  }
  for (const v of byFeeRange) {
    v.rate = v.total > 0 ? (v.won / v.total) * 100 : 0;
  }

  return NextResponse.json({
    data: { totalQuoted, wonCount, conversionRate, pendingCount, byType, byFeeRange },
  });
}
