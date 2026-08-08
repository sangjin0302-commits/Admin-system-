/**
 * 레거시 `?lang=en` → `/en...` 301 잠금.
 * 실행: npx tsx scripts/tests/i18n-legacy-lang-check.ts
 *
 * 배경(실제로 났던 버그): 로케일별 정적(ISR) 페이지는 요청 쿼리를 읽을 수 없다.
 * 그래서 about·fees·contact·careers 처럼 정적화한 페이지에 `?lang=en` 으로 들어오면
 * 영어가 아니라 한국어가 그대로 나갔다 — 예전 색인·외부 링크로 들어온 외국인 방문자가
 * 한국어를 보게 된다. 처음엔 홈만 처리했는데 이후 정적화한 페이지에 확장하지 않아 샜다.
 *
 * 이 잠금은 두 가지를 강제한다.
 *  1) STATIC_EN_ROUTES 의 모든 KO 원본 경로가 미들웨어 matcher 에 들어 있을 것
 *     (matcher 에 없으면 미들웨어가 실행조차 되지 않아 리다이렉트가 조용히 새어 나간다)
 *  2) 미들웨어가 홈 전용이 아니라 isStaticEnRoute 기반으로 일반화돼 있을 것
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { STATIC_EN_ROUTES, LOCALE_PREFIX } from "../../src/lib/i18n-locale";

const ROOT = process.cwd();
const middleware = readFileSync(path.join(ROOT, "src/middleware.ts"), "utf8");

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  ✕  ${name}`);
  }
}

// matcher 배열만 잘라낸다(파일 다른 곳의 문자열과 섞이지 않게).
const matcherBlock = middleware.slice(middleware.indexOf("matcher: ["));
const matcherEnd = matcherBlock.indexOf("]");
const matcher = matcherBlock.slice(0, matcherEnd);

// STATIC_EN_ROUTES("/en/x") → KO 원본("/x"). feed.xml 은 페이지가 아니라 제외.
const koPaths = [...STATIC_EN_ROUTES]
  .filter((r) => r !== LOCALE_PREFIX && !r.endsWith(".xml"))
  .map((r) => r.slice(LOCALE_PREFIX.length));

check("홈(/)이 matcher 에 있다", /"\/"/.test(matcher));

for (const ko of koPaths) {
  // 정확히 그 경로이거나, 상위 세그먼트 와일드카드(`/services/:path*`)로 덮이면 통과.
  const exact = new RegExp(`"${ko.replace(/\//g, "\\/")}"`).test(matcher);
  const seg = ko.split("/")[1];
  const wildcard = new RegExp(`"\\/${seg}\\/:path\\*"`).test(matcher);
  check(`matcher 가 ${ko} 를 덮는다`, exact || wildcard);
}

check(
  "레거시 리다이렉트가 홈 전용이 아니라 isStaticEnRoute 로 일반화돼 있다",
  /isStaticEnRoute\(target\)/.test(middleware),
);
check(
  "리다이렉트는 301(영구)로 나간다",
  /NextResponse\.redirect\(url, 301\)/.test(middleware),
);
check(
  "리다이렉트 시 lang 쿼리를 제거한다",
  /searchParams\.delete\("lang"\)/.test(middleware),
);
check(
  "이미 /en 인 요청은 리다이렉트 대상에서 제외한다(루프 방지)",
  /!pathname\.startsWith\(LOCALE_PREFIX\)/.test(middleware),
);

if (failed > 0) {
  console.error(`\n[i18n-legacy-lang] FAILED (${failed})`);
  process.exit(1);
}
console.log(
  `[i18n-legacy-lang] OK — 레거시 ?lang=en 301 대상 ${koPaths.length}개가 matcher 에 모두 덮인다.`,
);
