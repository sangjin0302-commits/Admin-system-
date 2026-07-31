import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";

import { ImportControls } from "@/app/admin/blog-import/import-controls";

export const dynamic = "force-dynamic";

/** %-인코딩된 제목(과거 수입 데이터) 방어적 디코드. */
function decodeTitle(s: string): string {
  if (!s.includes("%")) return s;
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export default async function BlogListPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Marketing · Content"
        title="블로그 마케팅 허브"
        action={
          <div className="flex gap-2">
            <Link
              href="/admin/blog-translate"
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              영문 번역
            </Link>
            <a
              href="/blog"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-text-strong"
            >
              공개 블로그 보기 ↗
            </a>
          </div>
        }
      />

      {/* 마케팅 안내 */}
      <Card className="border-gold/30 bg-gold-soft/10 p-5">
        <p className="font-serif text-sm font-bold text-primary">블로그 = 주요 마케팅 수단</p>
        <p className="mt-1 text-xs leading-6 text-text-muted">
          네이버 블로그를 자동 수입 → 영문 자동 번역(구글 국제 유입) → 홈 쇼케이스·구독자 알림·텔레그램 공유로 확산합니다.
          아래에서 수입·번역·분류를 한 번에 관리하세요. (직접 글쓰기는 정책상 비활성 — 네이버 원문 + 번역만.)
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
          <span>총 <strong className="text-text-strong">{posts.length}</strong>편(최근 50)</span>
          <span>발행 <strong className="text-success">{publishedCount}</strong></span>
          <span>초안 <strong className="text-warning">{posts.length - publishedCount}</strong></span>
        </div>
        <div className="mt-3 rounded-lg border border-line bg-surface px-3 py-2 text-xs leading-6 text-text-muted">
          <strong className="text-text-strong">⏱ 자동 수입 일정</strong> — 매일 새벽 <strong>01:00 (KST)</strong> 네이버 RSS 최신 <strong>10편</strong>을
          <strong> 국문 수입 + 영문 자동 번역</strong>(ANTHROPIC_API_KEY 필요). 신규 글은 구독자·텔레그램 알림.
          과거글/전체·게시판별은 아래에서 수동 수입. RSS는 최신 10편만이라 <strong>전체는 대량 가져오기 필수</strong>.
        </div>
      </Card>

      {/* 수입 · 동기화 · 번역 · 분류 (한 곳) */}
      <Card className="p-6">
        <h3 className="mb-4 font-serif text-base font-bold text-primary">네이버 수입 · 동기화 · 분류</h3>
        <ImportControls />
      </Card>

      {/* 글 목록 */}
      <div>
        <h3 className="mb-3 font-serif text-base font-bold text-primary">글 목록 (최근 50)</h3>
        {posts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-text-muted">아직 글이 없습니다. 위에서 네이버 글을 가져오세요.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/admin/blog/${post.id}`}>
                <Card className="p-4 transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            post.published ? "bg-success" : "bg-warning"
                          }`}
                        />
                        <h3 className="truncate text-sm font-semibold text-text-strong">
                          {decodeTitle(post.title)}
                        </h3>
                      </div>
                      <p className="mt-1 truncate text-xs text-text-muted">
                        {post.excerpt || "발췌 없음"}
                      </p>
                    </div>
                    <div className="ml-4 flex shrink-0 items-center gap-3 text-xs text-text-muted">
                      <span className="rounded bg-surface-muted px-2 py-0.5">{post.category}</span>
                      <span>{post.titleEn ? "EN✓" : "EN—"}</span>
                      <span>{post.viewCount} views</span>
                      <span>{post.createdAt.toLocaleDateString("ko-KR")}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
