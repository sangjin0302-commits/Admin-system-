/**
 * 정적 /en 라우트 ↔ STATIC_EN_ROUTES 양방향 일치 잠금.
 *
 * 미들웨어는 `/en/*` 를 내부 rewrite(동적, 헤더주입)하되 STATIC_EN_ROUTES 에 든
 * 경로는 제외해 실제 app/en 정적 파일 라우트가 서빙되게 한다. 둘이 어긋나면:
 *  - set 에 있는데 라우트 없음 → 404
 *  - 라우트 있는데 set 에 없음 → 미들웨어가 rewrite 해 잘못된(동적/KO) 렌더로 shadow
 * 그래서 로케일별 정적화가 조용히 깨진다. 이 잠금이 회귀를 CI 에서 차단한다.
 *
 * 실행: npx tsx scripts/tests/static-en-routes-check.ts
 */
import { readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { STATIC_EN_ROUTES } from "@/lib/i18n-locale";

const ROOT = process.cwd();
const EN_DIR = join(ROOT, "src/app/en");

/** app/en 하위에서 실제 라우트(page.tsx/route.ts) 경로를 /en/... 형태로 수집. */
function collectEnRoutes(dir: string, prefix: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      // 동적 세그먼트([slug])는 정적 라우트가 아니므로 제외.
      if (name.startsWith("[")) continue;
      out.push(...collectEnRoutes(full, `${prefix}/${name}`));
    } else if (name === "page.tsx") {
      out.push(prefix || "/en");
    } else if (name === "route.ts" || name === "route.tsx") {
      out.push(prefix || "/en");
    }
  }
  return out;
}

const actual = new Set(collectEnRoutes(EN_DIR, "/en"));
const declared = STATIC_EN_ROUTES;

// 1) 선언(STATIC_EN_ROUTES)에 있는데 실제 라우트가 없으면 404 위험.
for (const route of declared) {
  assert.ok(
    actual.has(route),
    `STATIC_EN_ROUTES 에 ${route} 가 있으나 app/en 에 실제 라우트가 없음(404 위험). 라우트 추가하거나 set 에서 제거.`,
  );
}

// 2) 실제 정적 /en 라우트인데 선언에 없으면 미들웨어가 rewrite 로 shadow.
for (const route of actual) {
  assert.ok(
    declared.has(route),
    `app/en 에 정적 라우트 ${route} 가 있으나 STATIC_EN_ROUTES 에 없음(미들웨어 rewrite 로 shadow). set 에 추가.`,
  );
}

console.log(`static-en-routes lock: ${actual.size} 라우트 ↔ STATIC_EN_ROUTES 일치`);
