import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethos.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { url: "/", priority: 1.0 },
    { url: "/about", priority: 0.9 },
    { url: "/services", priority: 0.9 },
    { url: "/services/immigration", priority: 0.8 },
    { url: "/services/appeal", priority: 0.8 },
    { url: "/services/contract", priority: 0.8 },
    { url: "/services/license", priority: 0.8 },
    { url: "/quick-check", priority: 0.85 },
    { url: "/cases", priority: 0.7 },
    { url: "/blog", priority: 0.7 },
    { url: "/contact", priority: 0.6 },
    { url: "/fees", priority: 0.6 },
    { url: "/track", priority: 0.5 },
    { url: "/intake", priority: 0.5 },
    { url: "/privacy", priority: 0.3 },
    { url: "/terms", priority: 0.3 }
  ];

  // 영문 버전이 있는 라우트 (hreflang 대체 표기)
  const bilingual = new Set([
    "/", "/about", "/services", "/services/immigration", "/services/appeal",
    "/services/contract", "/services/license", "/cases", "/intake"
  ]);

  return routes.map((r) => {
    const koUrl = `${SITE_URL}${r.url}`;
    const entry: MetadataRoute.Sitemap[number] = {
      url: koUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: r.priority
    };
    if (bilingual.has(r.url)) {
      entry.alternates = {
        languages: { ko: koUrl, en: `${koUrl}?lang=en`, "x-default": koUrl }
      };
    }
    return entry;
  });
}
