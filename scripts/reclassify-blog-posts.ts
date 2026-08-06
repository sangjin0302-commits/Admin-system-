/**
 * 네이버 수입 블로그 재분류.
 *
 * 배경: 예전 import 는 본문(스크레이프)까지 분류에 넣었는데, 본문에 사이드바·관련글
 * 등 비자 도배 chrome 이 섞여 계약/심판/인허가 글까지 전부 visa 로 오분류됐다.
 * importer 는 이미 제목+요약 기준으로 수정됨. 이 스크립트는 **이미 저장된** 글의
 * 카테고리를 제목+요약 기준으로 다시 계산해 바로잡는다.
 *
 * 안전: 기본 DRY-RUN. 실제 반영은 `--apply`.
 * 실행:
 *   npx tsx scripts/reclassify-blog-posts.ts            # dry-run
 *   npx tsx scripts/reclassify-blog-posts.ts --apply    # 실제 반영
 */
import { prisma } from "../src/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "../src/lib/services/naver-rss-importer";
import { classifyBlogPost } from "../src/lib/services/blog-categorizer";

const APPLY = process.argv.includes("--apply");

async function main() {
  const rows = await prisma.blogPost.findMany({
    where: { source: NAVER_BLOG_SOURCE },
    select: { id: true, slug: true, title: true, excerpt: true, category: true },
  });

  const changes: { id: string; slug: string; from: string; to: string; title: string }[] = [];
  for (const r of rows) {
    const next = classifyBlogPost(`${r.title}\n${r.excerpt ?? ""}`, r.title);
    if (next !== r.category) {
      changes.push({ id: r.id, slug: r.slug, from: r.category, to: next, title: r.title });
    }
  }

  console.log(`[reclassify] ${rows.length}편 중 카테고리 변경 대상 ${changes.length}편`);
  const byMove = new Map<string, number>();
  for (const c of changes) {
    const k = `${c.from}→${c.to}`;
    byMove.set(k, (byMove.get(k) ?? 0) + 1);
  }
  for (const [k, n] of [...byMove.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${k}: ${n}편`);
  }
  console.log("\n샘플 15:");
  for (const c of changes.slice(0, 15)) {
    console.log(`   [${c.from}→${c.to}] ${c.title.slice(0, 40)}`);
  }

  if (changes.length === 0) return;
  if (!APPLY) {
    console.log("\n[reclassify] DRY-RUN — 반영 안 함. 적용하려면 --apply 추가.");
    return;
  }

  let updated = 0;
  for (const c of changes) {
    try {
      await prisma.blogPost.update({ where: { id: c.id }, data: { category: c.to } });
      updated++;
    } catch (e) {
      console.error(`  실패 ${c.slug}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`\n[reclassify] 완료 — ${updated}편 재분류.`);
}

main()
  .catch((e) => {
    console.error("[reclassify] ERROR", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
