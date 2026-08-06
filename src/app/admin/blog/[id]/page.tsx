import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { notFound } from "next/navigation";
import { BlogEditor } from "./blog-editor";

export const dynamic = "force-dynamic";

/** 이미 쓰인 게시판(폴더) 목록 — 에디터 datalist 로 재사용 편의 제공. */
async function listBoards(): Promise<string[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      where: { board: { not: null } },
      select: { board: true },
      distinct: ["board"],
      orderBy: { board: "asc" },
    });
    return rows.map((r) => r.board).filter((b): b is string => !!b && b.trim().length > 0);
  } catch {
    return [];
  }
}

export default async function BlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const boards = await listBoards();

  if (id === "new") {
    return (
      <div className="space-y-6">
        <AdminPageHeader kicker="Blog CMS" title="새 글 작성" />
        <BlogEditor post={null} boards={boards} />
      </div>
    );
  }

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader kicker="Blog CMS" title="글 수정" />
      <BlogEditor
        boards={boards}
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          category: post.category,
          tags: post.tags,
          published: post.published,
          pinned: post.pinned,
          sortOrder: post.sortOrder,
          board: post.board ?? "",
          titleEn: post.titleEn ?? "",
          excerptEn: post.excerptEn ?? "",
          bodyEn: post.bodyEn ?? "",
          cardNews: post.cardNews ?? "",
          cardNewsEn: post.cardNewsEn ?? "",
          scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : "",
        }}
      />
    </div>
  );
}
