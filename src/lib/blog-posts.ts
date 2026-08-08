/**
 * /content/blog/*.md 파일을 frontmatter 기반으로 읽어 블로그 포스트 목록을 반환.
 * Node 런타임 (filesystem)에서만 동작 — Edge 페이지에서는 사용 불가.
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { logger } from "@/lib/utils/logger";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMin: number;
  contentHtml: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

async function listBlogFiles(): Promise<string[]> {
  try {
    const all = await readdir(CONTENT_DIR);
    return all.filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  } catch {
    return [];
  }
}

/** quiet: 파일이 없을 수 있는 탐색용 호출(로그를 남기지 않는다). */
async function readPostFromFile(file: string, quiet = false): Promise<BlogPost | null> {
  try {
    const full = path.join(CONTENT_DIR, file);
    const raw = await readFile(full, "utf-8");
    const { data, content } = matter(raw);
    const processed = await remark().use(remarkHtml).process(content);
    const slug = String(data.slug ?? file.replace(/\.(md|mdx)$/, ""));
    return {
      slug,
      title: String(data.title ?? slug),
      excerpt: String(data.excerpt ?? ""),
      category: String(data.category ?? "기타"),
      date: String(data.date ?? ""),
      readMin: Number(data.readMin ?? 5),
      contentHtml: String(processed)
    };
  } catch (error) {
    if (!quiet) logger.error("[blog] failed to read", file, error);
    return null;
  }
}

/**
 * content/blog 는 배포 산출물이라 런타임에 바뀌지 않는다. 그런데 예전에는 요청마다
 * 전체 파일을 읽고 remark 로 마크다운→HTML 변환까지 다시 했다(목록 페이지는 본문을
 * 쓰지도 않는데). /blog TTFB 가 4.7초였던 원인 중 하나. 인스턴스 수명 동안 1회만 계산한다.
 * 값이 아니라 Promise 를 캐시해 동시 요청이 중복 계산하지 않게 한다.
 */
let allPostsPromise: Promise<BlogPost[]> | null = null;

export async function listBlogPosts(): Promise<BlogPost[]> {
  if (!allPostsPromise) {
    allPostsPromise = (async () => {
      const files = await listBlogFiles();
      // map 에 함수를 그대로 넘기면 두 번째 인자(index)가 quiet 으로 들어간다 — 명시 람다.
      const posts = (await Promise.all(files.map((f) => readPostFromFile(f)))).filter(
        (p): p is BlogPost => p !== null
      );
      return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
    })().catch((error) => {
      allPostsPromise = null; // 실패는 캐시하지 않는다(다음 요청에서 재시도).
      throw error;
    });
  }
  return allPostsPromise;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  // 빠른 경로: slug 와 파일명이 같은 일반적인 경우엔 그 파일 하나만 읽는다.
  // (예전엔 일치하는 글을 찾을 때까지 모든 파일을 읽고 HTML 변환까지 했다.)
  for (const ext of [".md", ".mdx"]) {
    const direct = await readPostFromFile(`${slug}${ext}`, true);
    if (direct?.slug === slug) return direct;
  }
  // 폴백: frontmatter 의 slug 가 파일명과 다른 경우 — 캐시된 전체 목록에서 찾는다.
  const all = await listBlogPosts();
  return all.find((p) => p.slug === slug) ?? null;
}
