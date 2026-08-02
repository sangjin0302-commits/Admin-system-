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
      select: { slug: true, updatedAt: true, publishedAt: true, originalUrl: true, bodyEn: true },
      take: 500,
      orderBy: { publishedAt: "desc" },
    });
    for (const b of blogs) {
      const lastModified = b.updatedAt ?? b.publishedAt ?? undefined;
      if (b.originalUrl) {
        // 네이버 수입글: KO 는 noindex(정본=네이버) → sitemap 제외.
        // EN 번역만 색인 대상(고유 콘텐츠)이므로 있으면 그 URL 을 등재.
        if (b.bodyEn) {
          out.push({ url: `/blog/${b.slug}?lang=en`, priority: 0.6, lastModified });
        }
      } else {
        // 자체 작성 원본글: KO 색인 대상.
        out.push({ url: `/blog/${b.slug}`, priority: 0.65, lastModified });
      }
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
    // CMS 서비스 상세(국·영) — legacy 와 겹치는 슬러그는 리다이렉트되므로 제외.
    // 고유 서비스만 등재(arabic-interpretation·civil-petition).
    ...[
      "arabic-interpretation", "civil-petition",
    ].map((s) => ({ url: `/services/${s}`, priority: 0.7 })),
    { url: "/quick-check", priority: 0.85 },
    { url: "/consult", priority: 0.75 },
    { url: "/gazette", priority: 0.6 },
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
    // SS2: 지역 SEO 랜딩
    ...[
      "gangnam", "seocho", "songpa", "gangdong", "gwangjin", "seongdong", "dongdaemun",
      "jungnang", "nowon", "dobong", "gangbuk", "seongbuk", "jongno", "junggu", "yongsan",
      "mapo", "seodaemun", "eunpyeong", "yangcheon", "gangseo", "guro", "geumcheon",
      "yeongdeungpo", "dongjak", "gwanak", "suwon", "yongin", "seongnam", "goyang",
      "bucheon", "incheon",
    ].map((r) => ({ url: `/local/${r}`, priority: 0.65 })),
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
    // 리다이렉트되는 CMS 슬러그는 제외(중복 방지). 고유 서비스만 등재.
    "/services/arabic-interpretation",
    "/services/civil-petition",
    "/gazette",
    "/cases",
    "/intake",
    "/consult",
    "/blog",
    "/keyword",
  ]);

  // 영문 별도 랜딩 추가 (웹은 국문·영문만 제공)
  staticRoutes.push(
    { url: "/en", priority: 0.95 }
  );

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
        languages: {
          ko: koUrl,
          en: r.url === "/" ? `${SITE_URL}/en` : `${koUrl}?lang=en`,
          "x-default": koUrl
        } as Record<string, string | undefined> as Record<string, string>,
      };
    }
    return entry;
  });
}
