import Link from "next/link";

import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
const fmtDateTime = (d: Date) =>
  d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  WON: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-600",
  QUOTE_SENT: "bg-amber-100 text-amber-800",
  OPEN: "bg-emerald-100 text-emerald-800",
  SUBMITTED: "bg-indigo-100 text-indigo-800",
  CANCELLED: "bg-red-100 text-red-700"
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

type TimelineEvent = {
  date: Date;
  type: "inquiry" | "case";
  title: string;
  status: string;
  id: string;
  description?: string;
  category?: string;
};

export default async function CustomerDetailPage({
  params
}: {
  params: Promise<{ email: string }>;
}) {
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  /* ── load inquiries for this customer ── */
  const inquiries = await prisma.inquiry.findMany({
    where: { email },
    include: {
      caseMatters: {
        include: {
          accountingMemo: true,
          events: { orderBy: { createdAt: "desc" }, take: 10 }
        }
      },
      quotes: { select: { id: true, status: true, totalMin: true, totalMax: true, createdAt: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  if (inquiries.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="ui-kicker">Customer CRM</p>
          <h2 className="mt-2 ui-page-title">고객을 찾을 수 없습니다</h2>
          <p className="mt-2 text-sm text-text-muted">이메일: {email}</p>
          <Link href="/admin/crm" className="mt-4 inline-block text-sm text-primary hover:underline">
            &larr; 고객 목록으로
          </Link>
        </Card>
      </div>
    );
  }

  /* ── derive customer info from most recent inquiry ── */
  const latest = inquiries[0];
  const customerName = latest.contactName;
  const customerPhone = latest.phone;

  /* ── build unified timeline ── */
  const events: TimelineEvent[] = [];

  for (const inq of inquiries as any[]) {
    events.push({
      date: inq.createdAt,
      type: "inquiry",
      title: inq.title,
      status: inq.status,
      id: inq.id,
      description: inq.generatedSummary || undefined
    });

    for (const cm of inq.caseMatters) {
      events.push({
        date: cm.createdAt,
        type: "case",
        title: cm.title,
        status: cm.status,
        id: cm.id,
        category: cm.category
      });
    }
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  /* ── summary stats ── */
  const inqsAny = inquiries as any[];
  const totalCases = inqsAny.reduce((s: number, i: any) => s + (i.caseMatters?.length ?? 0), 0);
  const totalRevenue = inqsAny.reduce(
    (s: number, i: any) =>
      s + (i.caseMatters ?? []).reduce((cs: number, cm: any) => cs + (cm.accountingMemo?.paidAmount ?? 0), 0),
    0
  );
  const KRW = new Intl.NumberFormat("ko-KR");

  return (
    <div className="space-y-6">
      {/* header */}
      <Card className="p-6">
        <p className="ui-kicker">Customer CRM</p>
        <h2 className="mt-2 ui-page-title">{customerName}</h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-text-muted">
          <span>{email}</span>
          {customerPhone && <span>{customerPhone}</span>}
        </div>
        <Link href="/admin/crm" className="mt-4 inline-block text-sm text-primary hover:underline">
          &larr; 고객 목록으로
        </Link>
      </Card>

      {/* summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard label="문의 건수" value={String(inquiries.length)} />
        <SummaryCard label="사건 건수" value={String(totalCases)} />
        <SummaryCard
          label="총 매출"
          value={totalRevenue > 0 ? `${KRW.format(totalRevenue)}원` : "—"}
        />
        <SummaryCard
          label="최근 연락"
          value={fmtDate(latest.latestContactAt ?? latest.updatedAt)}
        />
      </div>

      {/* timeline */}
      <Card className="p-6">
        <h3 className="text-base font-semibold">통합 타임라인</h3>
        <p className="mt-1 text-xs text-text-muted">문의와 사건을 시간순으로 표시합니다.</p>

        {events.length === 0 ? (
          <p className="mt-6 text-sm text-text-muted">이벤트가 없습니다.</p>
        ) : (
          <div className="relative mt-6 ml-4 border-l-2 border-border pl-6">
            {events.map((ev, i) => (
              <div key={`${ev.type}-${ev.id}-${i}`} className="relative mb-8 last:mb-0">
                {/* dot */}
                <div
                  className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                    ev.type === "inquiry" ? "bg-blue-500" : "bg-emerald-500"
                  }`}
                />

                {/* date + badge row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-text-muted">{fmtDateTime(ev.date)}</span>
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      ev.type === "inquiry"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {ev.type === "inquiry" ? "문의" : "사건"}
                  </span>
                  <StatusBadge status={ev.status} />
                  {ev.category && (
                    <span className="text-[10px] text-text-muted">{ev.category}</span>
                  )}
                </div>

                {/* title */}
                <p className="mt-1 text-sm font-medium">
                  {ev.type === "inquiry" ? (
                    <Link
                      href={`/admin/inquiries/${ev.id}`}
                      className="text-primary hover:underline"
                    >
                      {ev.title}
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/cases/${ev.id}`}
                      className="text-primary hover:underline"
                    >
                      {ev.title}
                    </Link>
                  )}
                </p>

                {/* description */}
                {ev.description && (
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">{ev.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* quotes summary */}
      {inqsAny.some((i: any) => i.quotes?.length > 0) && (
        <Card className="p-6">
          <h3 className="text-base font-semibold">견적 내역</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  <th className="px-3 py-2">날짜</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2 text-right">금액(최소)</th>
                  <th className="px-3 py-2 text-right">금액(최대)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inqsAny.flatMap((inq: any) =>
                  (inq.quotes ?? []).map((q: any) => (
                    <tr key={q.id}>
                      <td className="px-3 py-2 text-text-muted">{fmtDate(q.createdAt)}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-3 py-2 text-right">{KRW.format(q.totalMin)}원</td>
                      <td className="px-3 py-2 text-right">{KRW.format(q.totalMax)}원</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </Card>
  );
}
