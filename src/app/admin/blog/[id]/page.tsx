import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { notFound } from "next/navigation";
import { BlogEditor } from "./blog-editor";

export const dynamic = "force-dynamic";

export default async function BlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === "new") {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="ui-kicker">Blog CMS</p>
          <h2 className="mt-2 ui-page-title">새 글 작성</h2>
        </Card>
        <BlogEditor post={null} />
      </div>
    );
  }

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Blog CMS</p>
        <h2 className="mt-2 ui-page-title">글 수정</h2>
      </Card>
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
