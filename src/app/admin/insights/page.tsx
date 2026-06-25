import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { CATEGORY_LABEL, type BlogCategory } from "@/lib/services/blog-categorizer";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [
    totalPosts,
    naverPosts,
    latestImport,
    byCategory,
    inquiriesTotal,
    inquiries7d
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
    }).catch(() => 0)
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Operations"
        title="운영 인사이트"
        description="콘텐츠 누적 · 분야별 분포 · 의뢰 현황 한눈 보기."
      />

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
