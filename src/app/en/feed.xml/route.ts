import { prisma } from "@/lib/prisma/client";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethosattorney.com";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * English RSS feed — only posts with translated title (titleEn).
 */
export async function GET() {
  const posts = await prisma.blogPost
    .findMany({
      where: { published: true, titleEn: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: { slug: true, title: true, titleEn: true, excerpt: true, excerptEn: true, publishedAt: true, updatedAt: true }
    })
    .catch(() => []);

  const items = posts
    .map((p) => {
      const url = `${BASE}/blog/${p.slug}?lang=en`;
      const date = (p.publishedAt ?? p.updatedAt ?? new Date()).toUTCString();
      const title = p.titleEn ?? p.title;
      const desc = p.excerptEn ?? p.excerpt ?? "";
      return `<item>
  <title>${esc(title)}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <pubDate>${date}</pubDate>
  <description>${esc(desc)}</description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>ETHOS Administrative Attorney Office — Legal Columns (English)</title>
  <link>${BASE}/en</link>
  <description>Korean administrative procedures for foreign nationals. Visa, business registration, contracts, administrative appeals by Jean.</description>
  <language>en-US</language>
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
