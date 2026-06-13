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

  return routes.map((r) => ({
    url: `${SITE_URL}${r.url}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: r.priority
  }));
}
