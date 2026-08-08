/**
 * 공개 페이지 페이로드/색인 회귀 잠금.
 * 실행: npx tsx scripts/tests/public-payload-guard-check.ts
 *
 * 2026-08 실측에서 /gazette TTFB 5.4초·HTML 3.7MB, /blog 4.7초가 나왔다. 원인은
 * ① 관보 외부 fetch 가 no-store 라 매 요청 1500건 왕복, ② month 미지정이 "전체 기간"이라
 * 1500건 전량 렌더, ③ 블로그가 요청마다 전체 마크다운을 remark 로 HTML 변환,
 * ④ /local 31개(사실상 동일 문서·내부링크 0)를 sitemap 이 광고해 색인 거부 유발.
 *
 * 넷 다 "고쳐도 티가 안 나서 조용히 되돌아가기 쉬운" 종류라 소스 수준에서 잠근다.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  ✕  ${name}`);
  }
}

// ── 1) 관보 외부 fetch 는 캐시된다 ───────────────────────────────────────────
const gazetteClient = read("src/lib/services/gazette-client.ts");
const listFetchBlock =
  gazetteClient.slice(gazetteClient.indexOf("export async function fetchGazetteList"))
    .slice(0, 2000);
check(
  "fetchGazetteList 는 revalidate 캐시를 쓴다",
  /next:\s*\{\s*revalidate:\s*\d+/.test(listFetchBlock),
);
check(
  "fetchGazetteList 목록 조회에 no-store 가 없다",
  !/cache:\s*"no-store"/.test(listFetchBlock),
);

// ── 2) 관보 페이지는 기본이 최근 달이고 전체 보기엔 상한이 있다 ──────────────
const gazettePage = read("src/app/gazette/page.tsx");
check(
  "전체 기간은 ?month=all 로 명시 선택한다",
  /const ALL_MONTHS = "all"/.test(gazettePage),
);
check(
  "전체 기간 렌더 상한(ALL_VIEW_LIMIT)이 있다",
  /const ALL_VIEW_LIMIT = \d+/.test(gazettePage),
);
check(
  "month 미지정이면 가장 최근 달로 떨어진다",
  /months\[0\]\s*\?\?\s*null/.test(gazettePage),
);
check(
  "전체 기간에서도 slice 로 상한을 적용한다",
  /board\.slice\(0,\s*ALL_VIEW_LIMIT\)/.test(gazettePage),
);
// 검색·일자 네비게이션도 같은 상한 안에서 동작해야 한다(검색이 1500건을 통째로 렌더하면
// 관보 페이지가 3.7MB 로 돌아간다).
check(
  "검색 결과에도 ALL_VIEW_LIMIT 상한을 적용한다",
  /filter\(matchesQuery\)\.slice\(0,\s*ALL_VIEW_LIMIT\)/.test(gazettePage),
);
check(
  "검색은 제목·기관·요약·근거법령을 모두 훑는다",
  /i\.title,\s*i\.agency,\s*i\.summary,\s*i\.legalBasis/.test(gazettePage),
);
check(
  "일자 필터는 자료가 있는 날만 허용한다(빈 날 클릭 방지)",
  /daysInMonth\.includes\(sp\.date\)/.test(gazettePage),
);

// ── 3) 블로그 마크다운은 인스턴스당 1회만 읽고 변환한다 ─────────────────────
const blogPosts = read("src/lib/blog-posts.ts");
check(
  "listBlogPosts 결과를 모듈 레벨에서 캐시한다",
  /let allPostsPromise/.test(blogPosts) && /return allPostsPromise/.test(blogPosts),
);
check(
  "실패는 캐시하지 않는다(다음 요청에서 재시도)",
  /allPostsPromise = null/.test(blogPosts),
);
check(
  "getBlogPostBySlug 는 slug 동명 파일을 먼저 읽는다",
  /readPostFromFile\(`\$\{slug\}\$\{ext\}`/.test(blogPosts),
);

// ── 4) sitemap 은 고아·중복 /local 을 광고하지 않는다 ───────────────────────
const sitemap = read("src/app/sitemap.ts");
check(
  "sitemap 에 /local 항목이 없다",
  !/url:\s*`\/local\//.test(sitemap),
);
check(
  "sitemap 은 자체 작성 블로그글을 KO 로 등재한다",
  /url:\s*`\/blog\/\$\{b\.slug\}`/.test(sitemap),
);
check(
  "sitemap 은 수입글 KO 를 등재하지 않는다(EN 번역만)",
  /url:\s*`\/en\/blog\/\$\{b\.slug\}`/.test(sitemap),
);

if (failed > 0) {
  console.error(`\n[public-payload-guard] FAILED (${failed})`);
  process.exit(1);
}
console.log(
  "[public-payload-guard] OK — 관보 캐시·렌더 상한, 블로그 마크다운 캐시, sitemap 색인 대상 유지.",
);
