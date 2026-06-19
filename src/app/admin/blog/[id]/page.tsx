import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma/client";
import { notFound } from "next/navigation";
import { BlogEditor } from "./blog-editor";

export const dynamic = "force-dynamic";

export default async function BlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === "new") {
    return (
      <div className="space-y-6">
        <AdminPageHeader kicker="Blog CMS" title="새 글 작성" />
        <BlogEditor post={null} />
      </div>
    );
  }

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader kicker="Blog CMS" title="글 수정" />
      <BlogEditor
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          category: post.category,
          tags: post.tags,
          published: post.published,
        }}
      />
    </div>
  );
}
