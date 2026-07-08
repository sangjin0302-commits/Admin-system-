import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { InquiryStatus, UrgencyLevel } from "@generated/prisma-client/client";

export const dynamic = "force-dynamic";

export default async function MorningPage() {
  if (!(await isFeatureEnabled("morning_briefing_view"))) notFound();

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const notClosed = { notIn: [InquiryStatus.WON, InquiryStatus.CLOSED] };

  const showChannelKpi = await isFeatureEnabled("morning_channel_kpi");
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [dueSoon, unresponded, yesterdayNew, urgent, todayNew, channel7d] = await Promise.all([
    prisma.inquiry.findMany({
      where: { dueDate: { lte: in7Days, gte: now }, status: notClosed },
      select: { id: true, title: true, contactName: true, dueDate: true, urgencyLevel: true },
      orderBy: { dueDate: "asc" },
      take: 8,
    }).catch(() => []),
    prisma.inquiry.findMany({
      where: { firstResponseAt: null, status: notClosed, createdAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      select: { id: true, title: true, contactName: true, createdAt: true, intakeChannel: true },
      orderBy: { createdAt: "asc" },
      take: 8,
    }).catch(() => []),
    prisma.inquiry.count({ where: { createdAt: { gte: startOfYesterday, lt: startOfDay } } }).catch(() => 0),
    prisma.inquiry.count({
      where: { urgencyLevel: { in: [UrgencyLevel.HIGH, UrgencyLevel.CRITICAL] }, status: notClosed },
    }).catch(() => 0),
    prisma.inquiry.count({ where: { createdAt: { gte: startOfDay } } }).catch(() => 0),
    showChannelKpi
      ? prisma.inquiry.groupBy({
          by: ["intakeChannel"],
          where: { createdAt: { gte: startOfWeek } },
          _count: { _all: true },
        }).catch(() => [] as Array<{ intakeChannel: string | null; _count: { _all: number } }>)
      : Promise.resolve([] as Array<{ intakeChannel: string | null; _count: { _all: number } }>),
  ]);
  const channelKpi = channel7d
    .map((r) => ({ channel: r.intakeChannel ?? "직접", count: r._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const fmtDate = (d: Date) => d.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
  const daysUntil = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const hoursAgo = (d: Date) => Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Morning"
        title="아침 브리핑 · 3분 view"
        description={`${now.toLocaleDateString("ko-KR", { weekday: "long", month: "long", day: "numeric" })} · 오늘 처리할 것만.`}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="오늘 신규" value={todayNew} tone="primary" />
        <Stat label="어제 신규" value={yesterdayNew} tone="muted" />
        <Stat label="미응답 24h+" value={unresponded.length} tone={unresponded.length > 0 ? "red" : "emerald"} />
        <Stat label="긴급 활성" value={urgent} tone={urgent > 0 ? "amber" : "emerald"} />
      </div>

      {showChannelKpi && channelKpi.length > 0 && (
        <Card className="p-5">
          <p className="ui-kicker">지난 7일 채널별 신규 문의</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {channelKpi.map((c) => (
              <div key={c.channel} className="rounded border border-gold/20 bg-surface px-3 py-2">
                <p className="truncate text-[10px] uppercase tracking-wider text-text-muted">{c.channel}</p>
                <p className="mt-1 text-xl font-bold text-primary">{c.count}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="ui-kicker">D-7 이내 마감</p>
          <Link href="/admin/inbox?filter=urgent" className="text-xs text-gold-deep hover:underline">전체 보기 →</Link>
        </div>
        {dueSoon.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-600">임박한 마감 없음</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {dueSoon.map((r) => {
              const d = r.dueDate ? daysUntil(r.dueDate) : 0;
              const critical = d <= 2;
              return (
                <li key={r.id} className="flex items-center gap-3 text-sm">
                  <span className={`inline-flex h-6 w-12 shrink-0 items-center justify-center rounded font-bold text-xs ${critical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    D-{d}
                  </span>
                  <Link href={`/admin/inquiries/${r.id}`} className="flex-1 font-medium text-text-strong hover:text-gold-deep">
                    {r.title || "(제목 없음)"}
                  </Link>
                  <span className="text-xs text-text-muted">{r.contactName || "—"}</span>
                  <span className="text-xs text-text-muted">{r.dueDate ? fmtDate(r.dueDate) : "—"}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="ui-kicker">미응답 24h+ (지금 답장 필요)</p>
          <Link href="/admin/inbox?filter=unresponded" className="text-xs text-gold-deep hover:underline">전체 보기 →</Link>
        </div>
        {unresponded.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-600">모두 24h 이내 응답 완료.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {unresponded.map((r) => (
              <li key={r.id} className="flex items-center gap-3 text-sm">
                <span className="inline-flex h-6 w-16 shrink-0 items-center justify-center rounded bg-red-100 text-xs font-bold text-red-700">
                  {hoursAgo(r.createdAt)}h
                </span>
                <Link href={`/admin/inquiries/${r.id}`} className="flex-1 font-medium text-text-strong hover:text-gold-deep">
                  {r.title || "(제목 없음)"}
                </Link>
                <span className="text-xs text-text-muted">{r.contactName || "—"}</span>
                <span className="text-xs text-text-muted">{r.intakeChannel || "직접"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">빠른 이동</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickLink href="/admin/inbox" label="통합 수신함" />
          <QuickLink href="/admin/inquiries" label="문의 목록" />
          <QuickLink href="/admin/funnel" label="전환 퍼널" />
          <QuickLink href="/admin/insights" label="운영 인사이트" />
          <QuickLink href="/admin/channel-roi" label="채널 ROI" />
          <QuickLink href="/admin/landing-gaps" label="랜딩 갭" />
          <QuickLink href="/admin/tax-export" label="세무 CSV" />
          <QuickLink href="/admin/flag-audit" label="Flag 감사" />
          <QuickLink href="/admin/features" label="Feature 토글" />
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "primary" | "muted" | "red" | "emerald" | "amber" }) {
  const cls =
    tone === "red" ? "text-red-600" :
    tone === "emerald" ? "text-emerald-600" :
    tone === "amber" ? "text-amber-600" :
    tone === "primary" ? "text-primary" : "text-text-muted";
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${cls}`}>{value.toLocaleString()}</p>
    </Card>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-gold/30 bg-surface px-3 py-1.5 text-xs font-bold text-text-strong hover:bg-gold-soft/30"
    >
      {label}
    </Link>
  );
}
