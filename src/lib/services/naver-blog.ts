/**
 * 네이버 블로그 RSS 연동.
 *
 * 네이버 블로그는 RSS를 공개 제공: https://rss.blog.naver.com/<blogId>.xml
 * blogId만 site-settings(naver.blogId)에 입력하면 칼럼 페이지에 자동 노출.
 *
 * - 외부 의존성 없이 정규식 파싱 (RSS는 단순 구조)
 * - 60분 캐시 (next revalidate)
 */

export type NaverBlogPost = {
  source: "naver";
  title: string;
  link: string;
  excerpt: string;
  date: string; // YYYY-MM-DD
  category: string;
};

function stripHtml(s: string): string {
  return s
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? stripHtml(m[1]) : "";
}

function formatDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * 네이버 블로그 RSS를 가져와 포스트 목록 반환.
 * 실패 시 빈 배열 (블로그 미설정 / 네트워크 오류 등) — 페이지 깨지지 않음.
 */
export async function fetchNaverBlogPosts(blogId: string, limit = 12): Promise<NaverBlogPost[]> {
  const id = blogId.trim();
  if (!id) return [];

  const url = `https://rss.blog.naver.com/${encodeURIComponent(id)}.xml`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (ETHOS site)" },
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      console.warn("[naver-blog] fetch failed", res.status, url);
      return [];
    }
    const xml = await res.text();

    const items = xml.split(/<item>/i).slice(1);
    const posts: NaverBlogPost[] = [];

    for (const raw of items.slice(0, limit)) {
      const block = raw.split(/<\/item>/i)[0];
      const title = pick(block, "title");
      const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
      const link = linkMatch ? stripHtml(linkMatch[1]) : "";
      const desc = pick(block, "description");
      const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "";
      const category = pick(block, "category") || "네이버 블로그";

      if (!title || !link) continue;

      posts.push({
        source: "naver",
        title,
        link,
        excerpt: desc.slice(0, 140),
        date: formatDate(pubDate),
        category
      });
    }

    return posts;
  } catch (error) {
    console.warn("[naver-blog] exception", error);
    return [];
  }
}
