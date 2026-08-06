/**
 * 블로그 데이터 정비 — 중복 정리 + 재분류. CLI 스크립트와 admin 엔드포인트가 공유.
 *
 * 두 작업 모두 `apply=false`(기본) 면 무엇을 바꿀지 리포트만 반환하고, `apply=true`
 * 여야 실제 삭제/수정한다. 파괴적 작업이므로 호출측(admin route)에서 SUPER 권한 필수.
 */
import { prisma } from "@/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { classifyBlogPost } from "@/lib/services/blog-categorizer";

export type DedupReport = {
  scanned: number;
  duplicateGroups: number;
  toDelete: number;
  deleted: number;
  sample: Array<{ keep: string; drop: string[] }>;
};

/** 제목 기준 중복 그룹에서 번역>본문>최초수입 우선으로 하나 남기고 나머지 삭제. */
export async function runBlogDedup(apply: boolean): Promise<DedupReport> {
  const rows = await prisma.blogPost.findMany({
    where: { source: NAVER_BLOG_SOURCE },
    select: { id: true, slug: true, title: true, importedAt: true, bodyEn: true, body: true },
  });

  const byTitle = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.title.trim();
    if (!key) continue;
    const arr = byTitle.get(key) ?? [];
    arr.push(r);
    byTitle.set(key, arr);
  }

  const score = (r: (typeof rows)[number]) =>
    (r.bodyEn && r.bodyEn.trim().length > 0 ? 1_000_000_000 : 0) + r.body.length;

  const groups = [...byTitle.values()].filter((g) => g.length > 1);
  const toDelete: string[] = [];
  const sample: DedupReport["sample"] = [];
  for (const g of groups) {
    const sorted = [...g].sort((a, b) => {
      const s = score(b) - score(a);
      if (s !== 0) return s;
      return (a.importedAt?.getTime() ?? 0) - (b.importedAt?.getTime() ?? 0);
    });
    const [keeper, ...losers] = sorted;
    losers.forEach((l) => toDelete.push(l.id));
    if (sample.length < 20) sample.push({ keep: keeper.slug, drop: losers.map((l) => l.slug) });
  }

  let deleted = 0;
  if (apply) {
    for (const id of toDelete) {
      try {
        await prisma.blogPost.delete({ where: { id } });
        deleted++;
      } catch {
        /* skip */
      }
    }
  }

  return { scanned: rows.length, duplicateGroups: groups.length, toDelete: toDelete.length, deleted, sample };
}

export type ReclassifyReport = {
  scanned: number;
  toChange: number;
  updated: number;
  moves: Record<string, number>;
  sample: Array<{ from: string; to: string; title: string }>;
};

/** 저장된 네이버 수입글을 제목+요약 기준으로 재분류(본문 오염 배제). */
export async function runBlogReclassify(apply: boolean): Promise<ReclassifyReport> {
  const rows = await prisma.blogPost.findMany({
    where: { source: NAVER_BLOG_SOURCE },
    select: { id: true, title: true, excerpt: true, category: true },
  });

  const changes: Array<{ id: string; from: string; to: string; title: string }> = [];
  for (const r of rows) {
    const next = classifyBlogPost(`${r.title}\n${r.excerpt ?? ""}`, r.title);
    if (next !== r.category) changes.push({ id: r.id, from: r.category, to: next, title: r.title });
  }

  const moves: Record<string, number> = {};
  for (const c of changes) {
    const k = `${c.from}→${c.to}`;
    moves[k] = (moves[k] ?? 0) + 1;
  }

  let updated = 0;
  if (apply) {
    for (const c of changes) {
      try {
        await prisma.blogPost.update({ where: { id: c.id }, data: { category: c.to } });
        updated++;
      } catch {
        /* skip */
      }
    }
  }

  return {
    scanned: rows.length,
    toChange: changes.length,
    updated,
    moves,
    sample: changes.slice(0, 20).map((c) => ({ from: c.from, to: c.to, title: c.title.slice(0, 50) })),
  };
}
