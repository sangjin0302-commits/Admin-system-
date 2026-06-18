import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BlogListPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="ui-kicker">Content Management</p>
            <h2 className="mt-2 ui-page-title">블로그 관리</h2>
          </div>
          <Link
            href="/admin/blog/new"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-text-strong"
          >
            + 새 글 작성
          </Link>
        </div>
      </Card>

      {posts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-text-muted">아직 작성된 블로그 글이 없습니다.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post: { id: string; title: string; slug: string; excerpt: string; body: string; category: string; tags: string; published: boolean; viewCount: number; createdAt: Date }) => (
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
                        {post.title}
                      </h3>
                    </div>
                    <p className="mt-1 truncate text-xs text-text-muted">
                      {post.excerpt || "발췌 없음"}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3 text-xs text-text-muted">
                    <span className="rounded bg-surface-muted px-2 py-0.5">{post.category}</span>
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
  );
}
