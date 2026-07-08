import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { InquiryStatus, UrgencyLevel } from "@generated/prisma-client/client";

export const dynamic = "force-dynamic";

const FILTER_OPTIONS = [
  { key: "unresponded", label: "미응답" },
  { key: "today", label: "오늘 접수" },
  { key: "urgent", label: "긴급/마감임박" },
  { key: "all", label: "전체" },
];

type FilterKey = (typeof FILTER_OPTIONS)[number]["key"];

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  if (!(await isFeatureEnabled("unified_inbox"))) notFound();

  const sp = (await searchParams) ?? {};
  const filter = (FILTER_OPTIONS.find((f) => f.key === sp.filter)?.key ?? "unresponded") as FilterKey;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const notClosed = { notIn: [InquiryStatus.WON, InquiryStatus.CLOSED] };
  const highUrg = { in: [UrgencyLevel.HIGH, UrgencyLevel.CRITICAL] };
  const where = (() => {
    switch (filter) {
      case "unresponded":
        return { firstResponseAt: null, status: notClosed };
      case "today":
        return { createdAt: { gte: startOfDay } };
      case "urgent":
        return {
          OR: [
            { urgencyLevel: highUrg },
            { dueDate: { lte: sevenDaysAhead, gte: now } },
          ],
          status: notClosed,
        };
      default:
        return {};
    }
  })();

  const [rows, counts] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      select: {
        id: true, title: true, contactName: true, email: true,
        phone: true, status: true, urgencyLevel: true, intakeChannel: true,
        createdAt: true, firstResponseAt: true, dueDate: true,
      },
      orderBy: [{ urgencyLevel: "desc" }, { createdAt: "desc" }],
      take: 100,
    }).catch(() => []),
    Promise.all([
      prisma.inquiry.count({ where: { firstResponseAt: null, status: notClosed } }).catch(() => 0),
      prisma.inquiry.count({ where: { createdAt: { gte: startOfDay } } }).catch(() => 0),
      prisma.inquiry.count({
        where: {
          OR: [{ urgencyLevel: highUrg }, { dueDate: { lte: sevenDaysAhead, gte: now } }],
          status: notClosed,
        },
      }).catch(() => 0),
      prisma.inquiry.count().catch(() => 0),
    ]),
  ]);

  const [cUn, cToday, cUrgent, cAll] = counts;

  const fmt = (d: Date) => d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const hoursAgo = (d: Date) => Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Operations"
        title="통합 수신함"
        description="채널 무관 · 상태 무관 · 응답 필요건 우선. 문의 최대 100건."
      />

      <div className="flex flex-wrap gap-2">
        {[
          { ...FILTER_OPTIONS[0], count: cUn },
          { ...FILTER_OPTIONS[1], count: cToday },
          { ...FILTER_OPTIONS[2], count: cUrgent },
          { ...FILTER_OPTIONS[3], count: cAll },
        ].map((f) => (
          <Link
            key={f.key}
            href={`/admin/inbox?filter=${f.key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filter === f.key
                ? "bg-primary text-white"
                : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"
            }`}
          >
            {f.label} <span className="ml-1 opacity-80">{f.count}</span>
          </Link>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-text-muted">해당 필터의 문의가 없습니다.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-surface-muted">
              <tr className="text-left">
                <th className="px-4 py-2 font-bold text-text-strong">긴급도</th>
                <th className="px-4 py-2 font-bold text-text-strong">제목</th>
                <th className="px-4 py-2 font-bold text-text-strong">이름</th>
                <th className="px-4 py-2 font-bold text-text-strong">채널</th>
                <th className="px-4 py-2 font-bold text-text-strong">상태</th>
                <th className="px-4 py-2 font-bold text-text-strong">접수</th>
                <th className="px-4 py-2 font-bold text-text-strong">응답</th>
                <th className="px-4 py-2 font-bold text-text-strong">마감</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isUnresponded = !r.firstResponseAt;
                const urgencyLevelColor =
                  r.urgencyLevel === "CRITICAL" ? "text-red-600" :
                  r.urgencyLevel === "HIGH" ? "text-amber-600" :
                  r.urgencyLevel === "MEDIUM" ? "text-text" : "text-text-muted";
                return (
                  <tr key={r.id} className="border-t border-gold/10 hover:bg-gold-soft/10">
                    <td className={`px-4 py-2 font-bold ${urgencyLevelColor}`}>{r.urgencyLevel ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/inquiries/${r.id}`} className="font-medium text-text-strong hover:text-gold-deep">
                        {r.title || "(제목 없음)"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-text-muted">{r.contactName || "—"}</td>
                    <td className="px-4 py-2 text-text-muted">{r.intakeChannel || "직접"}</td>
                    <td className="px-4 py-2"><span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] font-bold">{r.status}</span></td>
                    <td className="px-4 py-2 text-text-muted">{fmt(r.createdAt)}</td>
                    <td className={`px-4 py-2 text-xs ${isUnresponded ? "font-bold text-red-600" : "text-emerald-600"}`}>
                      {isUnresponded ? `${hoursAgo(r.createdAt)}h 대기` : `${hoursAgo(r.firstResponseAt!)}h 전 완료`}
                    </td>
                    <td className="px-4 py-2 text-text-muted">{r.dueDate ? fmt(r.dueDate) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
