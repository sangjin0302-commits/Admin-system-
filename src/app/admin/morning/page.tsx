import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getLeadScores } from "@/lib/services/lead-scoring-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CaseMatterStatus, InquiryStatus, UrgencyLevel } from "@generated/prisma-client/client";

export const dynamic = "force-dynamic";

export default async function MorningPage() {
  if (!(await isFeatureEnabled("morning_briefing_view"))) notFound();

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const notClosed = { notIn: [InquiryStatus.WON, InquiryStatus.CLOSED] };
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const showChannelKpi = await isFeatureEnabled("morning_channel_kpi");
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const caseNotClosed = { notIn: [CaseMatterStatus.CLOSED, CaseMatterStatus.CANCELLED] };
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [dueSoon, unresponded, yesterdayNew, urgent, todayNew, wonThisMonth, channel7d, activeCases, staleCases] = await Promise.all([
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
    prisma.inquiry.count({ where: { status: InquiryStatus.WON, updatedAt: { gte: startOfMonth } } }).catch(() => 0),
    showChannelKpi
      ? prisma.inquiry.groupBy({
          by: ["intakeChannel"],
          where: { createdAt: { gte: startOfWeek } },
          _count: { _all: true },
        }).catch(() => [] as Array<{ intakeChannel: string | null; _count: { _all: number } }>)
      : Promise.resolve([] as Array<{ intakeChannel: string | null; _count: { _all: number } }>),
    prisma.caseMatter.count({ where: { status: caseNotClosed } }).catch(() => 0),
    prisma.caseMatter.findMany({
      where: { status: caseNotClosed, updatedAt: { lte: sevenDaysAgo } },
      select: { id: true, title: true, caseNo: true, status: true, updatedAt: true },
      orderBy: { updatedAt: "asc" },
      take: 6,
    }).catch(() => []),
  ]);
  const channelKpi = channel7d
    .map((r) => ({ channel: r.intakeChannel ?? "직접", count: r._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const fmtDate = (d: Date) => d.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
  const daysUntil = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const hoursAgo = (d: Date) => Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));

  // Lead scoring dashboard
  const showLeadScoring = await isFeatureEnabled("lead_scoring_dashboard");
  const topConversionChannels = showLeadScoring
    ? await getLeadScores()
        .then((r) => r.channels.filter((c) => c.wonCount > 0).slice(0, 3))
        .catch(() => [])
    : [];

  // Feature 1: 오늘 우선순위 자동 정렬
  const showPrioritySort = await isFeatureEnabled("morning_priority_sort");
  type PriorityItem = { id: string; title: string; score: number; hint: string; type: "inquiry" | "case" };
  const priorityItems: PriorityItem[] = [];

  if (showPrioritySort) {
    const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    for (const r of unresponded) {
      const waiting = hoursAgo(r.createdAt);
      const score = waiting * 2;
      priorityItems.push({ id: r.id, title: r.title || "(제목 없음)", score, hint: "답장 필요", type: "inquiry" });
    }

    for (const r of dueSoon) {
      const waiting = 0;
      const urgencyBonus = r.urgencyLevel === UrgencyLevel.CRITICAL ? 20 : r.urgencyLevel === UrgencyLevel.HIGH ? 10 : 0;
      const dueBonus = r.dueDate && r.dueDate <= in2Days ? 15 : 0;
      const score = waiting + urgencyBonus + dueBonus;
      priorityItems.push({ id: r.id, title: r.title || "(제목 없음)", score, hint: "마감 임박", type: "inquiry" });
    }

    for (const c of staleCases) {
      const staleDays = Math.floor((now.getTime() - c.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      const score = staleDays * 2;
      priorityItems.push({ id: c.id, title: c.title, score, hint: "업데이트 필요", type: "case" });
    }

    // Deduplicate by id, keep highest score
    const seen = new Map<string, PriorityItem>();
    for (const item of priorityItems) {
      const existing = seen.get(item.id);
      if (!existing || item.score > existing.score) seen.set(item.id, item);
    }
    priorityItems.length = 0;
    priorityItems.push(...Array.from(seen.values()));

    priorityItems.sort((a, b) => b.score - a.score);
    priorityItems.splice(8);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Morning"
        title="아침 브리핑 · 3분 view"
        description={`${now.toLocaleDateString("ko-KR", { weekday: "long", month: "long", day: "numeric" })} · 오늘 처리할 것만.`}
      />

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="오늘 신규" value={todayNew} tone="primary" />
        <Stat label="어제 신규" value={yesterdayNew} tone="muted" />
        <Stat label="미응답 24h+" value={unresponded.length} tone={unresponded.length > 0 ? "red" : "emerald"} />
        <Stat label="긴급 활성" value={urgent} tone={urgent > 0 ? "amber" : "emerald"} />
        <Stat label="진행중 사건" value={activeCases} tone="primary" />
        <Stat label="이번 달 WON" value={wonThisMonth} tone="emerald" />
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

      {showLeadScoring && topConversionChannels.length > 0 && (
        <Card className="p-5">
          <p className="ui-kicker">전환율 TOP 채널 (리드 스코어링)</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {topConversionChannels.map((ch) => (
              <div key={ch.channel} className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{ch.channel}</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{ch.wonRate}%</p>
                <p className="mt-0.5 text-[11px] text-text-muted">
                  {ch.wonCount}/{ch.inquiries}건 전환 · 평균 {ch.avgDaysToWon}일
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showPrioritySort && priorityItems.length > 0 && (
        <Card className="p-5">
          <p className="ui-kicker">오늘 우선순위 (자동 정렬)</p>
          <ul className="mt-4 space-y-2">
            {priorityItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <span className="inline-flex h-6 w-12 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                  {item.score}
                </span>
                <Link
                  href={item.type === "case" ? `/admin/cases/${item.id}` : `/admin/inquiries/${item.id}`}
                  className="flex-1 font-medium text-text-strong hover:text-gold-deep"
                >
                  {item.title}
                </Link>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  item.hint === "답장 필요" ? "bg-red-100 text-red-700" :
                  item.hint === "마감 임박" ? "bg-amber-100 text-amber-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {item.hint}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="ui-kicker">D-7 이내 마감</p>
          <Link href="/admin/inbox?filter=urgent" className="text-xs text-gold-deep hover:underline">전체 보기 →</Link>
        </div>
        {dueSoon.length === 0 ? (
          <EmptyState icon="✅" title="임박한 마감 없음" description="7일 내 마감 문의가 없습니다. 여유롭게 다른 업무를 진행하세요." />
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
        <div className="flex items-center justify-between">
          <p className="ui-kicker">7일+ 업데이트 없는 사건 (방치 주의)</p>
          <Link href="/admin/cases" className="text-xs text-gold-deep hover:underline">사건 목록 →</Link>
        </div>
        {staleCases.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-600">모든 진행중 사건이 7일 이내 업데이트됨.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {staleCases.map((c) => (
              <li key={c.id} className="flex items-center gap-3 text-sm">
                <span className="inline-flex h-6 w-14 shrink-0 items-center justify-center rounded bg-amber-100 text-xs font-bold text-amber-700">
                  {Math.floor((now.getTime() - c.updatedAt.getTime()) / (1000 * 60 * 60 * 24))}일
                </span>
                <Link href={`/admin/cases/${c.id}`} className="flex-1 font-medium text-text-strong hover:text-gold-deep">
                  {c.title}
                </Link>
                <span className="text-xs text-text-muted">{c.caseNo || "—"}</span>
                <span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-text-muted">{c.status}</span>
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
