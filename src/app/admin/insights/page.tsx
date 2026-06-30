import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { CATEGORY_LABEL, type BlogCategory } from "@/lib/services/blog-categorizer";
import { WeeklyInquiriesChart, CategoryPieChart, StatusBarChart } from "@/components/admin/insights-charts";
import { getTopSearchQueries } from "@/lib/services/gsc-service";

export const dynamic = "force-dynamic";

import Link from "next/link";

const PERIOD_OPTIONS = [
  { key: "7", label: "7일" },
  { key: "30", label: "30일" },
  { key: "90", label: "90일" }
] as const;

export default async function InsightsPage({
  searchParams
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const periodDays = Math.max(7, Math.min(90, Number(sp.period) || 30));
  const periodMs = periodDays * 24 * 60 * 60 * 1000;
  const [
    totalPosts,
    naverPosts,
    latestImport,
    byCategory,
    inquiriesTotal,
    inquiries7d,
    inquiries30d,
    inquiriesByStatus
  ] = await Promise.all([
    prisma.blogPost.count({ where: { published: true } }).catch(() => 0),
    prisma.blogPost.count({ where: { published: true, source: NAVER_BLOG_SOURCE } }).catch(() => 0),
    prisma.blogPost.findFirst({
      where: { source: NAVER_BLOG_SOURCE },
      orderBy: { importedAt: "desc" },
      select: { importedAt: true }
    }).catch(() => null),
    prisma.blogPost.groupBy({
      by: ["category"],
      where: { published: true, source: NAVER_BLOG_SOURCE },
      _count: { _all: true }
    }).catch(() => [] as Array<{ category: string; _count: { _all: number } }>),
    prisma.inquiry.count().catch(() => 0),
    prisma.inquiry.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    }).catch(() => 0),
    prisma.inquiry.findMany({
      where: { createdAt: { gte: new Date(Date.now() - periodMs) } },
      select: { createdAt: true }
    }).catch(() => [] as Array<{ createdAt: Date }>),
    prisma.inquiry.groupBy({
      by: ["status"],
      _count: { _all: true }
    }).catch(() => [] as Array<{ status: string; _count: { _all: number } }>)
  ]);

  const gscQueries = await getTopSearchQueries().catch(() => []);

  // 기간 일별 의뢰 시리즈 (7/30/90)
  const dayCounts = new Map<string, number>();
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayCounts.set(d.toISOString().slice(5, 10), 0);
  }
  for (const inq of inquiries30d) {
    const key = inq.createdAt.toISOString().slice(5, 10);
    if (dayCounts.has(key)) dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const weeklyData = Array.from(dayCounts.entries()).map(([day, count]) => ({ day, count }));

  const pieData = byCategory
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 6)
    .map((c) => ({
      name: CATEGORY_LABEL[c.category as BlogCategory] ?? c.category,
      value: c._count._all
    }));

  const statusData = inquiriesByStatus
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 8)
    .map((s) => ({ status: s.status, count: s._count._all }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Operations"
        title="운영 인사이트"
        description="콘텐츠 누적 · 분야별 분포 · 의뢰 현황 한눈 보기."
      />

      {/* 기간 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-gold-deep">
          기간
        </span>
        {PERIOD_OPTIONS.map((p) => (
          <Link
            key={p.key}
            href={`/admin/insights?period=${p.key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              String(periodDays) === p.key
                ? "bg-primary text-white"
                : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="총 블로그 글" value={totalPosts} hint="published" />
        <Stat label="네이버 import" value={naverPosts} hint={latestImport?.importedAt ? `최근 ${latestImport.importedAt.toLocaleDateString("ko-KR")}` : "—"} />
        <Stat label="누적 문의" value={inquiriesTotal} hint="all-time" />
        <Stat label="7일 문의" value={inquiries7d} hint="rolling window" />
      </div>

      <Card className="p-5">
        <p className="ui-kicker">분야별 콘텐츠 분포</p>
        <p className="mt-1 text-sm text-text-muted">내부 세분류 기준 (공개 페이지는 5분야로 자동 그룹).</p>

        <div className="mt-5 space-y-2">
          {byCategory.length === 0 ? (
            <p className="text-sm text-text-muted">아직 분류된 글이 없습니다. /admin/blog-import → "대량 가져오기" 또는 "재분류" 실행 후 확인하세요.</p>
          ) : (
            byCategory
              .sort((a, b) => b._count._all - a._count._all)
              .map((c) => {
                const max = Math.max(...byCategory.map((x) => x._count._all));
                const ratio = c._count._all / max;
                const label = CATEGORY_LABEL[c.category as BlogCategory] ?? c.category;
                return (
                  <div key={c.category} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-xs font-semibold text-text-strong">{label}</span>
                    <div className="relative h-5 flex-1 overflow-hidden rounded bg-surface-muted">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-gold-deep transition-all"
                        style={{ width: `${Math.max(4, ratio * 100)}%` }}
                      />
                      <span className="relative z-10 ml-2 inline-flex h-full items-center text-[11px] font-bold text-text-strong">
                        {c._count._all}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="ui-kicker">최근 {periodDays}일 의뢰 추이</p>
          {weeklyData.some((d) => d.count > 0) ? (
            <div className="mt-4"><WeeklyInquiriesChart data={weeklyData} /></div>
          ) : (
            <p className="mt-3 text-sm text-text-muted">아직 30일 이내 의뢰 데이터가 없습니다.</p>
          )}
        </Card>

        <Card className="p-5">
          <p className="ui-kicker">분야별 콘텐츠 (Pie)</p>
          {pieData.length > 0 ? (
            <div className="mt-4"><CategoryPieChart data={pieData} /></div>
          ) : (
            <p className="mt-3 text-sm text-text-muted">분류 데이터 없음</p>
          )}
        </Card>
      </div>

      {statusData.length > 0 && (
        <Card className="p-5">
          <p className="ui-kicker">의뢰 상태별 분포</p>
          <div className="mt-4"><StatusBarChart data={statusData} /></div>
        </Card>
      )}

      {gscQueries.length > 0 && (
        <Card className="p-5">
          <p className="ui-kicker">검색 유입 키워드 (GSC)</p>
          <p className="mt-1 text-xs text-text-muted">최근 28일 Google Search Console 데이터</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/20 text-left">
                  <th className="pb-2 font-bold text-text-strong">키워드</th>
                  <th className="pb-2 text-right font-bold text-text-strong">클릭</th>
                  <th className="pb-2 text-right font-bold text-text-strong">노출</th>
                  <th className="pb-2 text-right font-bold text-text-strong">CTR</th>
                  <th className="pb-2 text-right font-bold text-text-strong">순위</th>
                </tr>
              </thead>
              <tbody>
                {gscQueries.map((q) => (
                  <tr key={q.query} className="border-b border-gold/10">
                    <td className="py-2 font-medium text-text">{q.query}</td>
                    <td className="py-2 text-right text-text-muted">{q.clicks}</td>
                    <td className="py-2 text-right text-text-muted">{q.impressions.toLocaleString()}</td>
                    <td className="py-2 text-right text-text-muted">{q.ctr}%</td>
                    <td className="py-2 text-right text-text-muted">{q.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <p className="ui-kicker">운영 가이드</p>
        <ul className="mt-3 space-y-2 text-sm text-text-muted">
          <li>• <strong>대량 import</strong>: /admin/blog-import → "대량 가져오기 시작" 후 50편+ 자동 분류</li>
          <li>• <strong>자동 동기화</strong>: 매일 01:00 KST RSS sync (cron) — 신규 글 자동 반영</li>
          <li>• <strong>검토 응답</strong>: /admin/blog-import 페이지에 v4.8 템플릿 quick copy</li>
          <li>• <strong>GA4 연결</strong>: /admin/site-content → "Analytics" → GA4 측정 ID 입력</li>
          <li>• <strong>채널 추적</strong>: 5채널 클릭 자동 GA4 channel_click 이벤트 발송</li>
        </ul>
      </Card>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-primary">{value.toLocaleString()}</p>
      {hint && <p className="mt-1 text-[11px] text-text-muted">{hint}</p>}
    </Card>
  );
}
