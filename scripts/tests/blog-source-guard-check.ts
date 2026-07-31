/**
 * 블로그 콘텐츠 정책 잠금 검사.
 *
 * 정책: 블로그는 네이버 수입글 + 번역본만. 임의/AI 글 생성 금지([[blog-content-policy]]).
 *
 * 이 검사는 `blogPost.create*` 를 호출하는 파일을 스캔해서:
 *   - 네이버 importer 2곳만 가드 없이 허용
 *   - 그 외 모든 파일은 반드시 `assertBlogCreateAllowed` 를 호출해야 함
 * 위반 시 CI 실패 → 미래에 임의 생성 경로가 몰래 추가되는 것을 막는다.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "src");

// 가드 없이 blogPost.create 허용되는 파일(네이버 계열만).
const ALLOWED_WITHOUT_GUARD = [
  "naver-rss-importer.ts",
  "naver-bulk-importer.ts",
];

const CREATE_RE = /blogPost\.(create|createMany|upsert)\b/;
const GUARD_RE = /assertBlogCreateAllowed\b/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "__tests__") continue;
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

function main(): void {
  const violations: string[] = [];
  for (const file of walk(SRC)) {
    const src = readFileSync(file, "utf8");
    if (!CREATE_RE.test(src)) continue;
    const base = file.split(/[/\\]/).pop() ?? file;
    if (ALLOWED_WITHOUT_GUARD.includes(base)) continue;
    if (!GUARD_RE.test(src)) {
      violations.push(file.replace(process.cwd(), "."));
    }
  }

  if (violations.length > 0) {
    console.error("[blog-source-guard] 정책 위반 — blogPost.create 하는데 assertBlogCreateAllowed 미호출:");
    for (const v of violations) console.error("  - " + v);
    console.error(
      "\n블로그는 네이버 수입글 + 번역본만 허용됩니다. 임의 생성이 필요하면 해당 파일에서" +
        " assertBlogCreateAllowed(source) 를 호출하세요(정책 가드 통과 필요)."
    );
    process.exit(1);
  }

  console.log("[blog-source-guard] OK — 네이버 외 blogPost.create 는 모두 정책 가드로 보호됨.");

  // ── 정기 갱신(스케줄) + 실패 알림 잠금 — 사용자 요구로 회귀 금지 ──
  const dispatcher = readFileSync(join(SRC, "lib/services/cron-dispatcher-service.ts"), "utf8");
  const syncRoute = readFileSync(join(SRC, "app/api/cron/naver-rss-sync/route.ts"), "utf8");
  const lockFails: string[] = [];
  // #4: naver-rss-sync 가 크론 그룹에 등록되어 정기 실행되어야 함.
  if (!dispatcher.includes("/api/cron/naver-rss-sync")) {
    lockFails.push("cron-dispatcher-service.ts 에서 /api/cron/naver-rss-sync 등록이 사라짐 (정기 갱신 중단됨)");
  }
  // #3: 동기화 실패 시 텔레그램 알림이 있어야 함.
  if (!syncRoute.includes("blog_sync_failed")) {
    lockFails.push("naver-rss-sync/route.ts 에서 실패 텔레그램 알림(blog_sync_failed)이 사라짐");
  }
  if (lockFails.length > 0) {
    console.error("[blog-source-guard] 잠금 위반 (정기 갱신/실패 알림):");
    for (const v of lockFails) console.error("  - " + v);
    process.exit(1);
  }
  console.log("[blog-source-guard] OK — 정기 갱신 등록 + 실패 알림 잠금 유지.");
}

main();
