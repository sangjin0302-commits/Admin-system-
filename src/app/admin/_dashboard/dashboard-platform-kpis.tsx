import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";

function formatKRW(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

async function loadPlatformStats() {
  const since30 = new Date(Date.now() - 30 * 86400_000);
  try {
    const [
      payConfirmed,
      payPendingCount,
      esignPending,
      notifSent30,
      notifFailed30,
      invoicesIssued,
      analysisCompleted30,
    ] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "CONFIRMED" },
      }),
      prisma.payment.count({ where: { status: "REQUESTED" } }),
      prisma.eSignRequest.count({ where: { status: "PENDING" } }),
      prisma.notificationLog.count({
        where: { status: "SENT", createdAt: { gte: since30 } },
      }),
      prisma.notificationLog.count({
        where: { status: "FAILED", createdAt: { gte: since30 } },
      }),
      prisma.taxInvoice.count({ where: { status: { in: ["ISSUED", "SENT"] } } }),
      prisma.caseAnalysisRun.count({
        where: { status: "COMPLETED", createdAt: { gte: since30 } },
      }),
    ]);
    return {
      paymentTotal: Number(payConfirmed._sum.amount ?? 0),
      paymentCount: payConfirmed._count,
      paymentPending: payPendingCount,
      esignPending,
      notifSent: notifSent30,
      notifFailed: notifFailed30,
      invoicesIssued,
      analysisCompleted: analysisCompleted30,
    };
  } catch {
    return null;
  }
}

export async function DashboardPlatformKpis() {
  const stats = await loadPlatformStats();
  if (!stats) return null;

  const items: Array<{
    label: string;
    value: string;
    sub?: string;
    href?: string;
    accent?: "emerald" | "amber" | "rose" | "indigo" | "violet" | "slate";
  }> = [
    {
      label: "결제 누적",
      value: formatKRW(stats.paymentTotal),
      sub: `${stats.paymentCount}건 승인 · ${stats.paymentPending}건 대기`,
      href: "/admin/payments",
      accent: "emerald",
    },
    {
      label: "서명 대기",
      value: `${stats.esignPending}건`,
      sub: "위임장/계약서 진행중",
      href: "/admin/signatures",
      accent: "amber",
    },
    {
      label: "알림 30일",
      value: `${stats.notifSent}건 발송`,
      sub:
        stats.notifFailed > 0
          ? `⚠ 실패 ${stats.notifFailed}건`
          : "발송 실패 없음",
      href: "/admin/notifications",
      accent: stats.notifFailed > 0 ? "rose" : "indigo",
    },
    {
      label: "세금계산서",
      value: `${stats.invoicesIssued}건`,
      sub: "발행 누적",
      href: "/admin/tax-invoices",
      accent: "violet",
    },
    {
      label: "AI 분석 30일",
      value: `${stats.analysisCompleted}건`,
      sub: "Lawbot 자동/수동",
      href: "/admin/timeline?kind=case_event",
      accent: "slate",
    },
  ];

  const accentClass: Record<string, string> = {
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
    indigo: "text-indigo-700",
    violet: "text-violet-700",
    slate: "text-slate-700",
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="ui-kicker">Platform</p>
          <h3 className="mt-1 ui-section-title">결제·서명·알림·세금계산서·AI</h3>
        </div>
        <Link
          href="/admin/timeline"
          className="text-sm font-medium text-primary"
        >
          통합 타임라인 →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        {items.map((it) => (
          <Link
            key={it.label}
            href={it.href ?? "#"}
            className="block rounded-lg border border-line bg-white p-3 md:p-4 hover:border-text-strong"
          >
            <p className="text-xs text-text-muted">{it.label}</p>
            <p
              className={`mt-1 text-base md:text-xl font-semibold tabular-nums ${accentClass[it.accent ?? "slate"]}`}
            >
              {it.value}
            </p>
            {it.sub && (
              <p className="mt-0.5 text-xs text-text-muted">{it.sub}</p>
            )}
          </Link>
        ))}
      </div>
    </Card>
  );
}
