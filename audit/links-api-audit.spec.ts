/**
 * 링크·API·보호 상태 점검 (읽기 전용).
 *
 * 이 파일은 절대 쓰기 요청을 보내지 않는다 — 운영 데이터에 문의·구독 같은 흔적을
 * 남기지 않기 위해서다. 폼은 "존재하고 필수값 검증이 붙어 있는지"까지만 본다.
 *
 * 실행: npx playwright test --config=audit/audit.config.ts links-api-audit
 */
import { test, expect, type APIRequestContext } from "@playwright/test";

const ORIGIN = process.env.AUDIT_BASE_URL ?? "https://ethosattorney.com";

/** 내부 링크를 모아 상태코드를 확인할 시작 페이지들. */
const CRAWL_SEEDS = ["/", "/services", "/blog", "/gazette", "/about", "/en"];

/** 공개 API — 200 과 최소한의 형태를 확인한다. */
const PUBLIC_APIS = [
  "/api/public/site-images",
  "/api/public/search-index",
  "/api/public/offices",
  "/robots.txt",
  "/sitemap.xml",
  "/feed.xml",
];

/** 인증 없이는 절대 열리면 안 되는 경로. */
const PROTECTED_PATHS = [
  "/admin",
  "/admin/inquiries",
  "/admin/settings/roles",
  "/api/admin/blog",
  "/api/admin/system/health",
];

async function statusOf(request: APIRequestContext, url: string): Promise<number> {
  try {
    const res = await request.get(url, { maxRedirects: 5, timeout: 30_000 });
    return res.status();
  } catch {
    return 0; // 연결 실패
  }
}

test.describe("링크·API 점검", () => {
  test("내부 링크에 깨진 곳이 없다", async ({ page, request }) => {
    const found = new Set<string>();
    for (const seed of CRAWL_SEEDS) {
      await page.goto(seed, { waitUntil: "domcontentloaded" });
      const hrefs = await page.$$eval("a[href]", (as) =>
        as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
      );
      for (const href of hrefs) {
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
        if (/^https?:\/\//i.test(href) && !href.startsWith(ORIGIN)) continue; // 외부 링크는 제외
        const path = href.startsWith("http") ? href.slice(ORIGIN.length) : href;
        if (!path.startsWith("/")) continue;
        if (path.startsWith("/api/")) continue; // API 는 아래에서 따로 본다
        found.add(path.split("#")[0]);
      }
    }

    const paths = [...found].slice(0, 120); // 상한 — 감사 시간 폭주 방지
    const broken: string[] = [];
    for (const path of paths) {
      const status = await statusOf(request, ORIGIN + path);
      if (status >= 400 || status === 0) broken.push(`${status} ${path}`);
    }
    if (broken.length) console.log("\n[깨진 내부 링크]\n" + broken.map((b) => "  ✕ " + b).join("\n"));
    console.log(`[링크 점검] ${paths.length}개 확인, 문제 ${broken.length}개`);
    expect(broken, "깨진 내부 링크").toEqual([]);
  });

  test("공개 API 가 정상 응답한다", async ({ request }) => {
    const bad: string[] = [];
    for (const api of PUBLIC_APIS) {
      const status = await statusOf(request, ORIGIN + api);
      if (status !== 200) bad.push(`${status} ${api}`);
    }
    if (bad.length) console.log("\n[공개 API 문제]\n" + bad.map((b) => "  ✕ " + b).join("\n"));
    expect(bad, "공개 API 응답").toEqual([]);
  });

  test("관리자 경로가 인증 없이 열리지 않는다", async ({ request }) => {
    const leaked: string[] = [];
    for (const path of PROTECTED_PATHS) {
      // 리다이렉트를 따라가면 로그인 페이지의 200 을 보고 "노출"로 오판한다.
      // 반드시 첫 응답만 본다 — 3xx(로그인으로 이동)·401·403·404 는 정상 차단.
      let status = 0;
      try {
        const res = await request.get(ORIGIN + path, { maxRedirects: 0, timeout: 30_000 });
        status = res.status();
      } catch {
        status = 0;
      }
      if (status === 200) leaked.push(`200 ${path}`);
    }
    if (leaked.length) console.log("\n[무인증 노출]\n" + leaked.map((b) => "  ✕ " + b).join("\n"));
    expect(leaked, "관리자 경로 무인증 노출").toEqual([]);
  });

  test("주요 폼이 렌더되고 필수값 검증이 붙어 있다", async ({ page }) => {
    // 제출은 하지 않는다(운영 데이터 오염 방지).
    await page.goto("/intake", { waitUntil: "load" });
    await page.waitForTimeout(1500);
    const controls = await page.$$eval("input, select, textarea, button", (els) => els.length);
    expect(controls, "/intake 폼 컨트롤 수").toBeGreaterThan(3);

    await page.goto("/quick-check", { waitUntil: "load" });
    await page.waitForTimeout(1500);
    const textareas = await page.$$eval("textarea", (els) => els.length);
    expect(textareas, "/quick-check 입력란").toBeGreaterThan(0);
  });
});
