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

async function readPostFromFile(file: string): Promise<BlogPost | null> {
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
    logger.error("[blog] failed to read", file, error);
    return null;
  }
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  const files = await listBlogFiles();
  const posts = (await Promise.all(files.map(readPostFromFile))).filter(
    (p): p is BlogPost => p !== null
  );
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const files = await listBlogFiles();
  for (const f of files) {
    const post = await readPostFromFile(f);
    if (post?.slug === slug) return post;
  }
  return null;
}
