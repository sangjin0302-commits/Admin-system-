import { prisma } from "@/lib/prisma/client";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethosattorney.com";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const posts = await prisma.blogPost
    .findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: { slug: true, title: true, excerpt: true, publishedAt: true, updatedAt: true }
    })
    .catch(() => []);

  const items = posts
    .map((p) => {
      const url = `${BASE}/blog/${p.slug}`;
      const date = (p.publishedAt ?? p.updatedAt ?? new Date()).toUTCString();
      return `<item>
  <title>${esc(p.title)}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <pubDate>${date}</pubDate>
  <description>${esc(p.excerpt ?? "")}</description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>ETHOS 행정사사무소 — 칼럼</title>
  <link>${BASE}/blog</link>
  <description>비자·행정심판·계약·인허가·법인설립 실무 칼럼. 행정사 Jean.</description>
  <language>ko-KR</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}
