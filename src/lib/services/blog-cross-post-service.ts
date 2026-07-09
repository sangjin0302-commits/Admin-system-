import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export interface CrossPostResult {
  title: string;
  formattedContent: string;
  sourceUrl: string;
}

export async function crossPostToNaver(blogPostId: string): Promise<CrossPostResult> {
  const post = await prisma.blogPost.findUnique({
    where: { id: blogPostId },
    select: { title: true, body: true, slug: true },
  });

  if (!post) {
    throw new Error("블로그 포스트를 찾을 수 없습니다");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ethosattorney.com";
  const sourceUrl = `${siteUrl}/blog/${post.slug}`;

  // Strip HTML tags for plain text version
  const plainContent = post.body
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n■ $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const formattedContent = `${post.title}

${plainContent}

─────────────────────
📌 원문 보기: ${sourceUrl}
© ETHOS 행정사사무소 | ethosattorney.com
─────────────────────

#행정사 #ETHOS행정사 #법률상담`;

  logger.info(`Cross-post formatted for Naver: ${blogPostId}`);

  return {
    title: post.title,
    formattedContent,
    sourceUrl,
  };
}
