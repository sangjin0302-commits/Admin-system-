import { test, expect } from "./fixtures";

/**
 * 외국인 마케팅 핵심 경로: 네이버 글 → 영어 번역 → 자체 도메인 노출.
 * 이 경로가 깨지면 링크드인/구글에서 온 영어 방문자가 한글만 보게 된다.
 */

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("ethos_intro_seen", "1");
      sessionStorage.setItem("ethos_onboarded", "1");
    } catch { /* ignore */ }
  });
});

test.describe("Blog i18n — 영문 진입점", () => {
  test.beforeAll(async ({ request }) => {
    // dev 서버 첫 컴파일 비용을 미리 치른다(제품 문제 아님).
    await Promise.all(
      ["/blog", "/blog?lang=en"].map((p) =>
        request.get(p, { timeout: 120_000, failOnStatusCode: false }).catch(() => undefined)
      )
    );
  });

  test("목록: /blog?lang=en 이 영어 헤딩 + KR/EN 토글 렌더", async ({ page }) => {
    const res = await page.goto("/blog?lang=en");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("h1").first()).toContainText(/Legal Columns/i);
    // 언어 토글 존재 — 방문자가 KR↔EN 전환 가능해야 함.
    await expect(page.getByRole("link", { name: "EN", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "KR", exact: true })).toBeVisible();
  });

  test("목록 하단 CTA 가 영문 접수(/intake?lang=en)로 연결", async ({ page }) => {
    await page.goto("/blog?lang=en");
    const enIntake = page.locator('a[href*="/intake?lang=en"]');
    expect(await enIntake.count()).toBeGreaterThan(0);
  });

  test("상세: 영어 글이 있으면 CTA 가 영문 접수로 연결 (없으면 skip)", async ({ page, request }) => {
    // DB 에 번역된(titleEn) 글이 있는 경우만 의미가 있으므로, 목록 HTML 에서 slug 를 뽑아 확인한다.
    const listHtml = await (await request.get("/blog?lang=en", { timeout: 120_000 })).text();
    const slug = listHtml.match(/href="\/blog\/([^"?#]+)/)?.[1];
    if (!slug) {
      test.skip(true, "로컬 DB 에 공개 블로그 글이 없어 건너뜀");
      return;
    }
    const res = await page.goto(`/blog/${slug}?lang=en`);
    expect(res?.status()).toBeLessThan(400);
    // 상세 글의 어떤 CTA 든 영문 접수 링크를 최소 하나 가져야 한다.
    const enIntake = page.locator('a[href*="/intake"][href*="lang=en"]');
    expect(await enIntake.count()).toBeGreaterThan(0);
  });
});
