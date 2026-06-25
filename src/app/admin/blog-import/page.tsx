import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import {
  NAVER_BLOG_RSS_URL,
  NAVER_BLOG_SOURCE,
} from "@/lib/services/naver-rss-importer";
import { ImportControls } from "./import-controls";
import { ReviewTemplateCopy } from "@/components/admin/review-template-copy";

export const dynamic = "force-dynamic";

export default async function BlogImportPage() {
  const [total, latest, recent] = await Promise.all([
    prisma.blogPost.count({ where: { source: NAVER_BLOG_SOURCE } }),
    prisma.blogPost.findFirst({
      where: { source: NAVER_BLOG_SOURCE },
      orderBy: { importedAt: "desc" },
      select: { importedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { source: NAVER_BLOG_SOURCE },
      orderBy: { importedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        source: true,
        importedAt: true,
        titleEn: true,
        originalUrl: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Content Import"
        title="네이버 블로그 가져오기"
        description={`소스: ${NAVER_BLOG_RSS_URL} · RSS를 매시 자동으로 동기화하고, Claude Haiku로 영문 번역본을 생성합니다.`}
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="총 가져온 글" value={String(total)} />
          <Stat
            label="마지막 가져오기"
            value={
              latest?.importedAt
                ? latest.importedAt.toLocaleString("ko-KR")
                : "—"
            }
          />
          <Stat label="자동 주기" value="매시 (cron 0 */1 * * *)" />
        </div>
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">수동 동기화</p>
        <p className="mt-1 text-sm text-text-muted">
          버튼을 누르면 즉시 RSS를 가져와서 신규 글을 저장합니다. 중복된 글은 건너뜁니다.
        </p>
        <div className="mt-4">
          <ImportControls />
        </div>
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">v4.8 검토 응답 템플릿 (Quick Copy)</p>
        <p className="mt-1 text-sm text-text-muted">의뢰 문의에 회신할 때 사용. 한·영·아랍어 3개 언어.</p>
        <div className="mt-4">
          <ReviewTemplateCopy />
        </div>
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">최근 가져온 글</p>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">아직 가져온 글이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-strong">
                    {p.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                    <span className="rounded bg-surface-muted px-2 py-0.5">{p.source}</span>
                    <span>{p.importedAt?.toLocaleString("ko-KR") ?? "—"}</span>
                    <span>{p.titleEn ? "EN ✓" : "EN ✗"}</span>
                  </div>
                </div>
                {p.originalUrl && (
                  <a
                    href={p.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-primary hover:underline"
                  >
                    원본 ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-text-strong">{value}</p>
    </div>
  );
}
