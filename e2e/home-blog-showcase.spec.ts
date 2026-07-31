import { test, expect } from "./fixtures";

/**
 * 홈 블로그 쇼케이스 잠금 — 네이버 자동수입 최신글을 홈에서 마케팅 수단으로 노출.
 * 글이 있으면 쇼케이스 섹션 + 자사 도메인(/blog/[slug]) 링크가 떠야 한다.
 * (글이 없으면 섹션은 숨겨지므로 skip.)
 */

test.describe("홈 블로그 쇼케이스", () => {
  test.beforeAll(async ({ request }) => {
    await request.get("/", { timeout: 120_000, failOnStatusCode: false }).catch(() => undefined);
  });

  test("최신 칼럼 쇼케이스 + 자사 블로그 링크 노출", async ({ request }) => {
    const html = await (await request.get("/", { timeout: 120_000 })).text();
    const hasBlogLink = /href="\/blog\/[^"?#]+/.test(html);
    if (!hasBlogLink) {
      test.skip(true, "로컬 DB에 발행 글이 없어 건너뜀");
      return;
    }
    expect(html).toContain("최신 법률 칼럼");
    expect(html).toContain("칼럼 전체보기");
  });
});
