import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import { InquiryStatus } from "@generated/prisma-client/client";

export const dynamic = "force-dynamic";

const INQUIRY_TYPE_LABEL: Record<string, string> = {
  FOREIGNER_VISA: "외국인 비자",
  IMMIGRATION_STAY: "출입국/체류",
  APOSTILLE_CONSULAR: "아포스티유/영사",
  TRANSLATION_NOTARY: "번역/공증",
  GENERAL_ADMIN_CIVIL: "일반 행정/민원",
  CORPORATE_REQUEST: "기업 의뢰",
  UNKNOWN: "미분류",
};

const FEE_RANGES = [
  { label: "50만 이하", min: 0, max: 500_000 },
  { label: "50~100만", min: 500_001, max: 1_000_000 },
  { label: "100~300만", min: 1_000_001, max: 3_000_000 },
  { label: "300만 초과", min: 3_000_001, max: Infinity },
];

export default async function QuoteConversionPage() {
  if (!(await isFeatureEnabled("quote_conversion_tracking"))) notFound();

  // Inquiries that have ever reached quote stage (QUOTE_DRAFTED, QUOTE_PENDING, QUOTE_SENT, WON, or have quotes)
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
  }).catch(() => []);

  const totalQuoted = inquiries.length;
  const wonCount = inquiries.filter((i) => i.status === InquiryStatus.WON).length;
  const conversionRate = totalQuoted > 0 ? ((wonCount / totalQuoted) * 100).toFixed(1) : "0.0";
  const pendingCount = inquiries.filter((i) =>
    ([InquiryStatus.QUOTE_PENDING, InquiryStatus.QUOTE_SENT, InquiryStatus.QUOTE_DRAFTED] as string[]).includes(i.status)
  ).length;

  // Group by inquiryType
  const byType = new Map<string, { total: number; won: number }>();
  for (const inq of inquiries) {
    const t = inq.inquiryType ?? "UNKNOWN";
    const entry = byType.get(t) ?? { total: 0, won: 0 };
    entry.total++;
    if (inq.status === InquiryStatus.WON) entry.won++;
    byType.set(t, entry);
  }

  // Group by fee range (use first quote's totalMin as proxy)
  const byFee = FEE_RANGES.map((r) => ({ ...r, total: 0, won: 0 }));
  for (const inq of inquiries) {
    const fee = inq.quotes[0]?.totalMin;
    if (fee == null) continue;
    const bucket = byFee.find((b) => fee >= b.min && fee <= b.max);
    if (!bucket) continue;
    bucket.total++;
    if (inq.status === InquiryStatus.WON) bucket.won++;
  }

  const pct = (won: number, total: number) =>
    total > 0 ? `${((won / total) * 100).toFixed(1)}%` : "—";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="마케팅"
        title="견적 전환율"
        description="견적 발송 → WON 전환율을 유형별·금액대별로 추적합니다."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "견적 발송 건", value: totalQuoted },
          { label: "WON 전환", value: wonCount },
          { label: "전환율", value: `${conversionRate}%` },
          { label: "대기 중", value: pendingCount },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4 text-center">
            <p className="text-xs font-bold text-text-muted">{kpi.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-text-strong">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* By inquiry type */}
      <Card className="p-0 overflow-hidden">
        <div className="border-b border-gold/10 px-4 py-3">
          <h3 className="text-sm font-bold text-text-strong">유형별 전환율</h3>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-surface-muted">
            <tr className="text-left">
              <th className="px-4 py-2 font-bold text-text-strong">유형</th>
              <th className="px-4 py-2 font-bold text-text-strong text-right">견적 건수</th>
              <th className="px-4 py-2 font-bold text-text-strong text-right">WON</th>
              <th className="px-4 py-2 font-bold text-text-strong text-right">전환율</th>
            </tr>
          </thead>
          <tbody>
            {[...byType.entries()]
              .sort((a, b) => b[1].total - a[1].total)
              .map(([type, data]) => (
                <tr key={type} className="border-t border-gold/10 hover:bg-gold-soft/10">
                  <td className="px-4 py-2 font-medium">{INQUIRY_TYPE_LABEL[type] ?? type}</td>
                  <td className="px-4 py-2 text-right text-text-muted">{data.total}</td>
                  <td className="px-4 py-2 text-right text-emerald-600 font-bold">{data.won}</td>
                  <td className="px-4 py-2 text-right font-bold">{pct(data.won, data.total)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>

      {/* By fee range */}
      <Card className="p-0 overflow-hidden">
        <div className="border-b border-gold/10 px-4 py-3">
          <h3 className="text-sm font-bold text-text-strong">금액대별 전환율</h3>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-surface-muted">
            <tr className="text-left">
              <th className="px-4 py-2 font-bold text-text-strong">금액대</th>
              <th className="px-4 py-2 font-bold text-text-strong text-right">견적 건수</th>
              <th className="px-4 py-2 font-bold text-text-strong text-right">WON</th>
              <th className="px-4 py-2 font-bold text-text-strong text-right">전환율</th>
            </tr>
          </thead>
          <tbody>
            {byFee.map((b) => (
              <tr key={b.label} className="border-t border-gold/10 hover:bg-gold-soft/10">
                <td className="px-4 py-2 font-medium">{b.label}</td>
                <td className="px-4 py-2 text-right text-text-muted">{b.total}</td>
                <td className="px-4 py-2 text-right text-emerald-600 font-bold">{b.won}</td>
                <td className="px-4 py-2 text-right font-bold">{pct(b.won, b.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
