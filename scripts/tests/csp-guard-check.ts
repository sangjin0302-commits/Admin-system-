/**
 * CSP 잠금 — 사이트 JS 전면 차단 재발 방지.
 * 실행: npx tsx scripts/tests/csp-guard-check.ts
 *
 * 배경(실제로 났던 사고): 프로덕션 CSP 가
 *   script-src 'self' 'nonce-...' 'strict-dynamic'
 * 였는데 nonce 를 **응답 헤더에만** 실었다. Next 는 요청 헤더의 CSP 에서 nonce 를 읽어
 * 자신이 렌더하는 <script> 에 붙이므로, 스크립트엔 nonce 가 없었다. 'strict-dynamic' 이
 * 있으면 'self' 가 무시되기 때문에 **모든 청크와 인라인 스크립트가 차단**됐고,
 * 하이드레이션이 일어나지 않아 페이지가 loading.tsx("Loading...")에 갇혔다.
 * 메뉴·폼·검색 등 인터랙션이 전부 죽은 상태로 서비스되고 있었다.
 *
 * 게다가 이 사이트는 홈·about·fees 등을 정적(ISR)으로 서빙한다. 요청마다 새로 만드는
 * nonce 는 캐시된 HTML 의 nonce 와 구조적으로 어긋나므로, 요청 헤더에 제대로 실어도
 * 성립하지 않는다(Next 도 정적 페이지 + nonce 는 미지원이라고 명시).
 *
 * 그래서 "정적 렌더와 양립하는 CSP"를 계약으로 잠근다.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const middleware = readFileSync(path.join(process.cwd(), "src/middleware.ts"), "utf8");

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  ✕  ${name}`);
  }
}

// buildCsp 본문만 검사(파일 다른 곳의 주석·설명과 섞이지 않게).
const start = middleware.indexOf("function buildCsp");
const body = middleware.slice(start, middleware.indexOf("\n}", start));

check("CSP 에 'strict-dynamic' 을 쓰지 않는다", !body.includes("strict-dynamic"));
check("CSP script-src 에 nonce 를 넣지 않는다", !/nonce-\$\{/.test(body) && !body.includes("'nonce-"));
check("buildCsp 는 nonce 인자를 받지 않는다", /function buildCsp\(\s*\)/.test(middleware));
check(
  "프로덕션 script-src 는 'self' + 'unsafe-inline' 을 허용한다(청크·스트리밍 스크립트)",
  /'self' 'unsafe-inline'/.test(body),
);
// GA4(gtag)는 googletagmanager 에서 로드된다 — 빠지면 분석이 통째로 죽는다(실제로 차단됐음).
check(
  "script-src 가 googletagmanager 를 허용한다(GA4)",
  middleware.includes("https://www.googletagmanager.com"),
);
check("응답에 x-nonce 헤더를 남기지 않는다", !middleware.includes('"x-nonce"'));

// 나머지 보안 헤더는 그대로 유지되어야 한다(같이 지워지는 사고 방지).
for (const h of [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Cross-Origin-Opener-Policy",
  "Cross-Origin-Resource-Policy",
]) {
  check(`${h} 헤더 유지`, middleware.includes(h));
}
for (const d of ["object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"]) {
  check(`CSP 지시자 유지: ${d}`, middleware.includes(d));
}

if (failed > 0) {
  console.error(`\n[csp-guard] FAILED (${failed})`);
  process.exit(1);
}
console.log("[csp-guard] OK — 정적 렌더와 양립하는 CSP 유지(스크립트 차단 재발 방지).");
