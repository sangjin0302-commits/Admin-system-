import { prisma } from "@/lib/prisma/client";

export async function getRelatedPosts(currentSlug: string, category: string | null, limit = 3) {
  return prisma.blogPost.findMany({
    where: {
      slug: { not: currentSlug },
      published: true,
      ...(category ? { category } : {}),
    },
    select: { slug: true, title: true, excerpt: true, category: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}
