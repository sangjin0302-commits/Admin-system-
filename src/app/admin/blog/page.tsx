import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";

import { ImportControls } from "@/app/admin/blog-import/import-controls";
import { BlogRowActions } from "@/app/admin/blog/blog-row-actions";

export const dynamic = "force-dynamic";

/** %-인코딩된 제목(과거 수입 데이터) 방어적 디코드. */
function decodeTitle(s: string): string {
  if (!s.includes("%") && !s.includes("+")) return s;
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s.replace(/\+/g, " ");
  }
}

export default async function BlogListPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Marketing · Content"
        title="블로그 마케팅 허브"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/blog/new"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-text-strong"
            >
              + 새 글 작성
            </Link>
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
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              공개 블로그 ↗
            </a>
          </div>
        }
      />

      {/* 직접 작성 중심 안내 */}
      <Card className="border-gold/30 bg-gold-soft/10 p-5">
        <p className="font-serif text-sm font-bold text-primary">블로그 = 주요 마케팅 수단 · 직접 작성</p>
        <p className="mt-1 text-xs leading-6 text-text-muted">
          <strong>+ 새 글 작성</strong>에서 국문·영문·게시판(폴더)·카드뉴스·이미지·태그·예약 게시까지 직접 작성합니다.
          영문은 국문을 참고해 직접 번역해 입력하세요(자동 번역·네이버 자동 수입은 기본 OFF).
          발행 글은 홈 쇼케이스·구독자 알림·텔레그램으로 확산됩니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
          <span>총 <strong className="text-text-strong">{posts.length}</strong>편(최근 2000)</span>
          <span>발행 <strong className="text-success">{publishedCount}</strong></span>
          <span>초안 <strong className="text-warning">{posts.length - publishedCount}</strong></span>
        </div>
        <div className="mt-3 rounded-lg border border-line bg-surface px-3 py-2 text-xs leading-6 text-text-muted">
          <strong className="text-text-strong">자동화(기본 OFF)</strong> — 네이버 자동 수입(<code>naver_blog_import</code>)·영문 자동 번역
          (<code>blog_auto_translate</code>)은 <strong>/admin/features</strong>에서 켤 수 있습니다. 끈 상태에선 크론이 아무것도 하지 않습니다.
        </div>
      </Card>

      {/* 네이버 수입(선택) — 자동은 OFF, 필요 시 수동 가져오기 */}
      <details className="rounded-xl border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-text-strong">
          네이버 수입 (선택) · 자동 OFF — 필요할 때만 수동 가져오기
        </summary>
        <div className="mt-4">
          <ImportControls />
        </div>
      </details>

      {/* 글 목록 */}
      <div>
        <h3 className="mb-3 font-serif text-base font-bold text-primary">글 목록 (최근 2000) · 글 클릭 → 수정/삭제</h3>
        {posts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-text-muted">아직 글이 없습니다. 위에서 네이버 글을 가져오세요.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="p-4 transition hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/admin/blog/${post.id}`} className="min-w-0 flex-1">
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
                  </Link>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-text-muted">
                    <span className="hidden rounded bg-surface-muted px-2 py-0.5 sm:inline">{post.category}</span>
                    <span className="hidden sm:inline">{post.titleEn ? "EN✓" : "EN—"}</span>
                    <span className="hidden md:inline">{post.viewCount} views</span>
                    <span className="hidden md:inline">{post.createdAt.toLocaleDateString("ko-KR")}</span>
                    <BlogRowActions id={post.id} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
