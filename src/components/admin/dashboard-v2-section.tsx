import Link from "next/link";

import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

/**
 * III7 — 관리자 대시보드 v2 상단 섹션.
 * KPI 4카드 + 7일 문의 추이 SVG + 긴급건 / 오늘 마감.
 */

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function formatCurrency(n: number): string {
  return `₩ ${new Intl.NumberFormat("ko-KR").format(Math.floor(n))}`;
}

async function safe<T>(label: string, task: Promise<T>, fallback: T): Promise<T> {
  try {
    return await task;
  } catch (error) {
    logger.error(`[admin_dashboard_v2] ${label} failed`, error);
    return fallback;
  }
}

export async function AdminDashboardV2Section() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [newToday, unanswered, wonThisWeek, monthRevenueAgg, dailyInquiries, urgentInquiries, dueTodayCases] =
    await Promise.all([
      safe("newToday", prisma.inquiry.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }), 0),
      safe(
        "unanswered",
        prisma.inquiry.count({
          where: { firstResponseAt: null, status: { notIn: ["CLOSED", "WON"] } }
        }),
        0
      ),
      safe(
        "wonThisWeek",
        prisma.inquiry.count({ where: { status: "WON", updatedAt: { gte: weekStart } } }),
        0
      ),
      safe(
        "monthRevenue",
        prisma.caseAccountingMemo.aggregate({
          _sum: { paidAmount: true },
          where: { paidAt: { gte: monthStart } }
        }),
        { _sum: { paidAmount: 0 } as { paidAmount: number | null } }
      ),
      safe(
        "dailyInquiries",
        prisma.inquiry.findMany({
          where: { createdAt: { gte: new Date(todayStart.getTime() - 6 * 24 * 3600 * 1000) } },
          select: { createdAt: true }
        }),
        [] as Array<{ createdAt: Date }>
      ),
      safe(
        "urgentInquiries",
        prisma.inquiry.findMany({
          where: {
            status: { notIn: ["CLOSED", "WON"] },
            urgencyLevel: { in: ["HIGH", "CRITICAL"] }
          },
          orderBy: [{ urgencyLevel: "desc" }, { createdAt: "asc" }],
          take: 5,
          select: { id: true, title: true, contactName: true, urgencyLevel: true, createdAt: true }
        }),
        [] as Array<{ id: string; title: string; contactName: string; urgencyLevel: string; createdAt: Date }>
      ),
      safe(
        "dueTodayCases",
        prisma.caseMatter.findMany({
          where: {
            dueDate: { gte: todayStart, lte: todayEnd },
            status: { notIn: ["CLOSED"] }
          },
          orderBy: [{ dueDate: "asc" }],
          take: 8,
          select: { id: true, caseNo: true, title: true, dueDate: true }
        }),
        [] as Array<{ id: string; caseNo: string | null; title: string; dueDate: Date | null }>
      )
    ]);

  // 7일 트렌드 버킷
  const buckets: Array<{ label: string; count: number }> = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    buckets.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0 });
  }
  for (const row of dailyInquiries) {
    const created = startOfDay(row.createdAt);
    const dayIdx = 6 - Math.floor((todayStart.getTime() - created.getTime()) / (24 * 3600 * 1000));
    if (dayIdx >= 0 && dayIdx < 7) buckets[dayIdx].count += 1;
  }
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  const monthRevenue = monthRevenueAgg._sum.paidAmount ?? 0;

  const kpis = [
    { label: "오늘 신규", value: newToday, tone: "text-info" },
    { label: "미응답", value: unanswered, tone: "text-danger" },
    { label: "이번주 WON", value: wonThisWeek, tone: "text-success" },
    { label: "이번달 매출", value: formatCurrency(monthRevenue), tone: "text-text-strong" }
  ];

  const chartW = 560;
  const chartH = 120;
  const barW = chartW / buckets.length - 8;

  return (
    <div className="space-y-4" data-testid="admin-dashboard-v2">
      {/* Top: 4 KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-xs text-text-muted">{k.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${k.tone}`}>{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Middle: 7-day inquiry trend */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-strong">최근 7일 문의 추이</h3>
          <p className="text-xs text-text-muted">총 {buckets.reduce((s, b) => s + b.count, 0)}건</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <svg viewBox={`0 0 ${chartW} ${chartH + 24}`} width="100%" height={chartH + 24} role="img" aria-label="7일 문의 추이">
            {buckets.map((b, i) => {
              const h = (b.count / maxCount) * chartH;
              const x = i * (barW + 8) + 4;
              const y = chartH - h;
              return (
                <g key={b.label}>
                  <rect x={x} y={y} width={barW} height={h} rx={3} className="fill-primary/70" />
                  <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize="10" className="fill-text-muted">
                    {b.label}
                  </text>
                  {b.count > 0 ? (
                    <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="10" className="fill-text-strong">
                      {b.count}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      {/* Bottom: 긴급건 / 오늘 마감 */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-text-strong">긴급건 Top 5</h3>
          {urgentInquiries.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">긴급건 없음.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {urgentInquiries.map((q) => {
                const ageDays = Math.max(0, Math.floor((now.getTime() - q.createdAt.getTime()) / (24 * 3600 * 1000)));
                return (
                  <li key={q.id} className="flex items-center justify-between gap-2">
                    <Link href={`/admin/inquiries/${q.id}`} className="truncate text-sm text-text-strong hover:underline">
                      <span className="mr-2 rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                        {q.urgencyLevel}
                      </span>
                      {q.title}
                    </Link>
                    <span className="shrink-0 text-xs text-text-muted">
                      {q.contactName} · {ageDays}일 경과
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-text-strong">오늘 마감 사건</h3>
          {dueTodayCases.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">오늘 마감 사건 없음.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {dueTodayCases.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <Link href={`/admin/cases/${c.id}`} className="truncate text-sm text-text-strong hover:underline">
                    <span className="mr-2 text-xs text-text-muted">{c.caseNo ?? "-"}</span>
                    {c.title}
                  </Link>
                  <span className="shrink-0 text-xs text-text-muted">
                    {c.dueDate ? `${c.dueDate.getHours()}:${String(c.dueDate.getMinutes()).padStart(2, "0")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
