import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethosattorney.com";

export const revalidate = 3600; // 1h ISR

async function loadDynamicRoutes(): Promise<
  Array<{ url: string; priority: number; lastModified?: Date }>
> {
  const out: Array<{ url: string; priority: number; lastModified?: Date }> = [];

  try {
    const blogs = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, publishedAt: true },
      take: 500,
      orderBy: { publishedAt: "desc" },
    });
    for (const b of blogs) {
      out.push({
        url: `/blog/${b.slug}`,
        priority: 0.65,
        lastModified: b.updatedAt ?? b.publishedAt ?? undefined,
      });
    }
  } catch {
    // ignore
  }

  try {
    const cases = await prisma.caseStudy.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
      take: 200,
      orderBy: { updatedAt: "desc" },
    });
    for (const c of cases) {
      out.push({
        url: `/cases/${c.id}`,
        priority: 0.6,
        lastModified: c.updatedAt,
      });
    }
  } catch {
    // ignore
  }

  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: Array<{ url: string; priority: number }> = [
    { url: "/", priority: 1.0 },
    { url: "/about", priority: 0.9 },
    { url: "/services", priority: 0.9 },
    { url: "/services/immigration", priority: 0.8 },
    { url: "/services/appeal", priority: 0.8 },
    { url: "/services/contract", priority: 0.8 },
    { url: "/services/license", priority: 0.8 },
    { url: "/services/corporate", priority: 0.8 },
    { url: "/quick-check", priority: 0.85 },
    { url: "/cases", priority: 0.7 },
    { url: "/blog", priority: 0.7 },
    { url: "/keyword", priority: 0.7 },
    { url: "/keyword/d-8-비자", priority: 0.8 },
    { url: "/keyword/d-10-비자", priority: 0.8 },
    { url: "/keyword/f-2-7-비자", priority: 0.8 },
    { url: "/keyword/행정심판", priority: 0.8 },
    { url: "/keyword/귀화", priority: 0.75 },
    { url: "/keyword/법인설립", priority: 0.75 },
    { url: "/keyword/강제퇴거", priority: 0.75 },
    { url: "/contact", priority: 0.6 },
    { url: "/fees", priority: 0.6 },
    { url: "/track", priority: 0.5 },
    { url: "/intake", priority: 0.5 },
    { url: "/privacy", priority: 0.3 },
    { url: "/terms", priority: 0.3 },
  ];

  const dynamicRoutes = await loadDynamicRoutes();

  const bilingual = new Set([
    "/",
    "/about",
    "/services",
    "/services/immigration",
    "/services/appeal",
    "/services/contract",
    "/services/license",
    "/services/corporate",
    "/cases",
    "/intake",
  ]);

  const all = [
    ...staticRoutes.map((r) => ({ ...r, lastModified: now })),
    ...dynamicRoutes,
  ];

  return all.map((r) => {
    const koUrl = `${SITE_URL}${r.url}`;
    const entry: MetadataRoute.Sitemap[number] = {
      url: koUrl,
      lastModified: r.lastModified ?? now,
      changeFrequency: "weekly",
      priority: r.priority,
    };
    if (bilingual.has(r.url)) {
      entry.alternates = {
        languages: { ko: koUrl, en: `${koUrl}?lang=en`, "x-default": koUrl },
      };
    }
    return entry;
  });
}
