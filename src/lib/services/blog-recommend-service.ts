import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type BlogRecommendation = {
  title: string;
  slug: string;
};

export async function getRelatedBlogPosts(
  inquiryType: string,
  keywords?: string[]
): Promise<BlogRecommendation[]> {
  try {
    const categoryMatch = inquiryType.toLowerCase();

    const posts = await prisma.blogPost.findMany({
      where: {
        published: true,
        OR: [
          { category: { contains: categoryMatch } },
          ...(keywords ?? []).map((kw) => ({ tags: { contains: kw } })),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { title: true, slug: true },
    });

    return posts.map((p) => ({ title: p.title, slug: p.slug }));
  } catch (err) {
    logger.warn("[blog-recommend] Query failed", err);
    return [];
  }
}
