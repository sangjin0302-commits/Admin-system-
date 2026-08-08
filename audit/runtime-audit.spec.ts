/**
 * 실사용 런타임 전수 점검 — 배포된 사이트를 실제 브라우저로 연다.
 *
 * 잡으려는 것: typecheck·unit·잠금 테스트가 전부 통과하는데도 **브라우저에서 죽어 있는**
 * 부류. 이번 세션에 실제로 이런 것들이 나왔다.
 *   - CSP 가 모든 스크립트를 막아 하이드레이션이 안 되고 페이지가 "Loading..." 에 갇힘
 *   - GA4 스크립트가 CSP 에 막혀 유입 분석이 통째로 죽음
 *   - 정적화한 페이지에서 ?lang=en 이 한국어를 반환
 * 서버 응답(200)만 봐서는 셋 다 안 보인다.
 *
 * 실행: npx playwright test --config=audit/audit.config.ts
 */
import { test, expect, type ConsoleMessage, type Request, type Response } from "@playwright/test";

type PageIssue = {
  path: string;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  httpErrors: string[];
  bodyTextLength: number;
  h1Count: number;
  h1Text: string;
  stuckLoading: boolean;
  brokenImages: string[];
};

/** 공개 페이지 — 사이트맵·nav 기준 주요 경로 + EN 대응본. */
const PUBLIC_PATHS = [
  "/",
  "/about",
  "/services",
  "/services/immigration",
  "/services/appeal",
  "/services/contract",
  "/services/license",
  "/services/corporate",
  "/fees",
  "/cases",
  "/consult",
  "/contact",
  "/careers",
  "/intake",
  "/quick-check",
  "/blog",
  "/gazette",
  "/keyword",
  "/track",
  "/privacy",
  "/terms",
];

const EN_PATHS = [
  "/en",
  "/en/about",
  "/en/fees",
  "/en/cases",
  "/en/consult",
  "/en/contact",
  "/en/careers",
  "/en/quick-check",
  "/en/services/immigration",
  "/en/blog",
  "/en/gazette",
];

/** 첫방문 오버레이가 클릭을 가로채지 않도록(기존 e2e fixture 와 동일한 우회). */
const DISMISS_OVERLAYS = () => {
  try {
    sessionStorage.setItem("ethos_intro_seen", "1");
    sessionStorage.setItem("ethos_onboarded", "1");
  } catch {
    /* ignore */
  }
};

/** 잡음(분석·확장 프로그램 등)은 제외하고 진짜 문제만 남긴다. */
const IGNORED_CONSOLE = [
  /favicon/i,
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
];

function isIgnorable(text: string): boolean {
  return IGNORED_CONSOLE.some((re) => re.test(text));
}

async function auditPage(page: import("@playwright/test").Page, path: string): Promise<PageIssue> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const httpErrors: string[] = [];

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text().slice(0, 300);
    if (!isIgnorable(text)) consoleErrors.push(text);
  });
  page.on("pageerror", (err: Error) => {
    pageErrors.push(String(err.message).slice(0, 300));
  });
  page.on("requestfailed", (req: Request) => {
    const failure = req.failure()?.errorText ?? "";
    // 사용자가 페이지를 떠나며 취소된 요청은 문제로 보지 않는다.
    if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(failure)) return;
    failedRequests.push(`${req.method()} ${req.url().slice(0, 160)} — ${failure}`);
  });
  page.on("response", (res: Response) => {
    if (res.status() >= 400) {
      httpErrors.push(`${res.status()} ${res.url().slice(0, 160)}`);
    }
  });

  await page.addInitScript(DISMISS_OVERLAYS);
  await page.goto(path, { waitUntil: "load" });
  // 하이드레이션·지연 로드가 끝날 여유.
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => {
    const h1s = Array.from(document.querySelectorAll("h1"));
    const main = document.querySelector("main");
    const mainText = (main?.innerText ?? "").trim();
    const broken = Array.from(document.querySelectorAll("img"))
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => (img.currentSrc || img.src || "").slice(0, 160))
      .filter(Boolean);
    return {
      bodyTextLength: document.body.innerText.trim().length,
      h1Count: h1s.length,
      h1Text: (h1s[0]?.textContent ?? "").trim().slice(0, 80),
      // 본문이 로딩 문구만 남아 있으면 스트리밍/하이드레이션이 끝나지 않은 것.
      stuckLoading: /^loading\.{0,3}$/i.test(mainText),
      brokenImages: broken.slice(0, 5),
    };
  });

  return { path, consoleErrors, pageErrors, failedRequests, httpErrors, ...info };
}

function report(issue: PageIssue): string {
  const lines: string[] = [];
  if (issue.stuckLoading) lines.push('  ✕ 본문이 "Loading..." 에서 멈춤(하이드레이션 실패)');
  if (issue.bodyTextLength < 400) lines.push(`  ✕ 본문이 비정상적으로 짧음(${issue.bodyTextLength}자)`);
  if (issue.h1Count === 0) lines.push("  ✕ h1 없음");
  for (const e of issue.pageErrors) lines.push(`  ✕ JS 예외: ${e}`);
  for (const e of issue.consoleErrors) lines.push(`  ✕ 콘솔 오류: ${e}`);
  for (const e of issue.failedRequests) lines.push(`  ✕ 요청 실패: ${e}`);
  for (const e of issue.httpErrors) lines.push(`  ✕ HTTP 오류: ${e}`);
  for (const e of issue.brokenImages) lines.push(`  ✕ 깨진 이미지: ${e}`);
  return lines.join("\n");
}

test.describe("실사용 런타임 점검", () => {
  for (const path of [...PUBLIC_PATHS, ...EN_PATHS]) {
    test(`${path}`, async ({ page }) => {
      const issue = await auditPage(page, path);
      const problems = report(issue);
      if (problems) {
        console.log(`\n[문제] ${path} (h1="${issue.h1Text}")\n${problems}`);
      }
      // 치명(페이지가 사용 불가)만 실패로 잡는다. 나머지는 로그로 남긴다.
      expect(issue.stuckLoading, `${path}: 본문이 Loading 에서 멈춤`).toBe(false);
      expect(issue.bodyTextLength, `${path}: 본문 길이`).toBeGreaterThan(300);
      expect(issue.pageErrors, `${path}: JS 예외`).toEqual([]);
    });
  }
});
