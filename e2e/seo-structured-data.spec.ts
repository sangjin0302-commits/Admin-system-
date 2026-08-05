import { test, expect } from "./fixtures";

/**
 * 구조화 데이터(JSON-LD) 회귀 잠금 — 구글 리치결과 근거.
 * DB 데이터 없이 렌더되는 페이지만 검증(기본값 폴백) → CI 결정적.
 * request 기반(브라우저 없이 HTML 확인)으로 dev 컴파일 비용 회피.
 */
test.describe("구조화 데이터(JSON-LD)", () => {
  test("홈 — LegalService/LocalBusiness JSON-LD 존재", async ({ request }) => {
    const html = await (await request.get("/", { timeout: 120_000 })).text();
    expect(html).toContain("application/ld+json");
    expect(/LegalService|LocalBusiness/.test(html)).toBeTruthy();
  });

  test("서비스 페이지 — FAQPage + Breadcrumb JSON-LD", async ({ request }) => {
    const html = await (await request.get("/services/immigration", { timeout: 120_000 })).text();
    expect(html).toContain("application/ld+json");
    expect(html).toContain("FAQPage");
    expect(html).toContain("BreadcrumbList");
  });

  test("키워드 랜딩 — Breadcrumb JSON-LD", async ({ request }) => {
    const html = await (await request.get("/keyword/행정심판", { timeout: 120_000 })).text();
    expect(html).toContain("application/ld+json");
    expect(html).toContain("BreadcrumbList");
  });

  test("관보 게시판 — 라우트 살아있음(200)", async ({ request }) => {
    const res = await request.get("/gazette", { timeout: 120_000, failOnStatusCode: false });
    expect(res.status()).toBeLessThan(400);
  });
});
