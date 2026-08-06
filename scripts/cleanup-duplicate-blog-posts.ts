/**
 * 네이버 수입 블로그 중복글 정리.
 *
 * 배경: dedup 결함으로 같은 글이 랜덤 slug 로 여러 번 수입돼 "두 개씩" 쌓였다
 * (importer 는 이미 수정됨 — 미래 중복은 막힘). 이 스크립트는 **이미 쌓인** 중복을
 * 제목 기준으로 묶어 하나만 남기고 나머지를 삭제한다.
 *
 * 보존 우선순위(같은 제목 그룹에서 keeper 선정):
 *   1) 영문 번역(bodyEn) 있는 글  2) 본문 긴 글  3) 먼저 수입된 글(importedAt asc)
 *
 * 안전: 기본은 DRY-RUN(무엇을 지울지 출력만). 실제 삭제는 `--apply` 필요.
 *
 * 실행:
 *   npx tsx scripts/cleanup-duplicate-blog-posts.ts            # dry-run
 *   npx tsx scripts/cleanup-duplicate-blog-posts.ts --apply    # 실제 삭제
 */
import { prisma } from "../src/lib/prisma/client";
import { NAVER_BLOG_SOURCE } from "../src/lib/services/naver-rss-importer";
import { blogTitleKey } from "../src/lib/blog-title-key";

const APPLY = process.argv.includes("--apply");

type Row = {
  id: string;
  slug: string;
  title: string;
  importedAt: Date | null;
  publishedAt: Date | null;
  bodyEn: string | null;
  body: string;
};

function score(r: Row): number {
  // 클수록 keeper. 번역 우선(1e9) + 본문길이 + 최초수입 가점(오래될수록↑는 뒤에서 tie-break).
  return (r.bodyEn && r.bodyEn.trim().length > 0 ? 1_000_000_000 : 0) + r.body.length;
}

async function main() {
  const rows = (await prisma.blogPost.findMany({
    where: { source: NAVER_BLOG_SOURCE },
    select: { id: true, slug: true, title: true, importedAt: true, publishedAt: true, bodyEn: true, body: true },
  })) as Row[];

  // 표시 기준 정규화 키로 그룹핑 — 인코딩만 다른 변종(%20/+/엔티티/대소문자)도 같은
  // 제목으로 묶어 실제로 눈에 보이는 중복을 잡는다(raw title.trim() 은 이를 놓쳤음).
  const byTitle = new Map<string, Row[]>();
  for (const r of rows) {
    const key = blogTitleKey(r.title);
    if (!key) continue;
    const arr = byTitle.get(key) ?? [];
    arr.push(r);
    byTitle.set(key, arr);
  }

  const dupGroups = [...byTitle.entries()].filter(([, g]) => g.length > 1);

  console.log(`[dedup-cleanup] 네이버 수입글 ${rows.length}편 중 중복 그룹 ${dupGroups.length}건`);
  if (dupGroups.length === 0) {
    console.log("[dedup-cleanup] 중복 없음. 종료.");
    return;
  }

  const toDelete: { id: string; slug: string; title: string }[] = [];
  for (const [title, group] of dupGroups) {
    // keeper: score 높은 것, 동점이면 먼저 수입된 것(importedAt asc)
    const sorted = [...group].sort((a, b) => {
      const s = score(b) - score(a);
      if (s !== 0) return s;
      const ta = a.importedAt?.getTime() ?? 0;
      const tb = b.importedAt?.getTime() ?? 0;
      return ta - tb;
    });
    const keeper = sorted[0];
    const losers = sorted.slice(1);
    console.log(`\n· "${title.slice(0, 40)}" (${group.length}편)`);
    console.log(`    KEEP  ${keeper.slug} (번역:${keeper.bodyEn ? "O" : "X"}, 본문:${keeper.body.length}자)`);
    for (const l of losers) {
      console.log(`    DROP  ${l.slug} (번역:${l.bodyEn ? "O" : "X"}, 본문:${l.body.length}자)`);
      toDelete.push({ id: l.id, slug: l.slug, title: l.title });
    }
  }

  console.log(`\n[dedup-cleanup] 삭제 대상 ${toDelete.length}편.`);
  if (!APPLY) {
    console.log("[dedup-cleanup] DRY-RUN — 실제 삭제 안 함. 적용하려면 --apply 추가.");
    return;
  }

  let deleted = 0;
  for (const d of toDelete) {
    try {
      await prisma.blogPost.delete({ where: { id: d.id } });
      deleted++;
    } catch (e) {
      console.error(`  삭제 실패 ${d.slug}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`[dedup-cleanup] 완료 — ${deleted}편 삭제.`);
}

main()
  .catch((e) => {
    console.error("[dedup-cleanup] ERROR", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
