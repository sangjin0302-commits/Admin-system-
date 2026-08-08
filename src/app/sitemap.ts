import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma/client";
import { getExtraKeywordLandings } from "@/lib/services/keyword-landing-service";
import { BASE_KEYWORD_LANDINGS } from "@/lib/constants/keyword-landings";
import { localePath } from "@/lib/i18n-locale";

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
          out.push({ url: `/en/blog/${b.slug}`, priority: 0.6, lastModified });
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

  try {
    const extras = await getExtraKeywordLandings();
    for (const e of extras) {
      out.push({ url: `/keyword/${e.slug}`, priority: 0.7 });
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
    ...BASE_KEYWORD_LANDINGS.map((k) => ({ url: `/keyword/${k.term}`, priority: k.priority })),
    { url: "/contact", priority: 0.6 },
    { url: "/fees", priority: 0.6 },
    { url: "/track", priority: 0.5 },
    { url: "/intake", priority: 0.5 },
    { url: "/privacy", priority: 0.3 },
    { url: "/terms", priority: 0.3 },
    // SS2 지역 SEO 랜딩(/local/*)은 sitemap 에 넣지 않는다.
    //
    // 31개 페이지가 본문 3만2천자 중 구 이름 몇 글자만 다른 사실상 동일 문서이고,
    // local_landing_grid·footer_local_links 가 꺼져 있어 내부 링크도 하나도 없다.
    // 그 상태로 sitemap 에만 올라가 있으니 구글이 doorway/중복으로 보고 색인을 거부했다
    // (GSC "발견됨·크롤링됨 — 현재 색인이 생성되지 않음"). 크롤링 예산만 축내는 셈이라
    // 광고를 멈추고 실제 콘텐츠에 집중시킨다. 페이지 자체는 그대로 200 으로 살아 있으므로,
    // 나중에 지역별로 내용을 실제로 다르게 채우고 그리드를 켜면 이 블록만 되살리면 된다.
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
          en: `${SITE_URL}${localePath(r.url, "en")}`,
          "x-default": koUrl
        } as Record<string, string | undefined> as Record<string, string>,
      };
    }
    return entry;
  });
}
