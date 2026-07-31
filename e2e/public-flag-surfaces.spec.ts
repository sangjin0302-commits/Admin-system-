import { test, expect } from "./fixtures";

/**
 * 기본 ON 인 공개 플래그의 실제 렌더 표면을 검증한다.
 * 잠금(locked) 전 근거가 되는 테스트 — 깨지면 잠금을 풀어야 한다는 신호.
 */

test.describe("공개 플래그 표면", () => {
  // dev 서버 첫 호출은 라우트 컴파일 때문에 느리다(제품 문제 아님).
  test.beforeAll(async ({ request }) => {
    await Promise.all(
      ["/api/public/features", "/", "/blog"].map((path) =>
        request.get(path, { timeout: 120_000, failOnStatusCode: false }).catch(() => undefined)
      )
    );
  });

  test("상담 플로팅 — 카카오톡 채널 안내 버튼 노출", async ({ page }) => {
    // AI 챗은 미작동으로 카카오 채널 플로팅으로 교체됨(2026-07-31).
    await page.goto("/");
    await expect(page.getByRole("link", { name: "카카오톡 채널로 상담하기" })).toBeVisible();
  });

  test("ai_chatbot — 플래그 API가 공개 플래그를 내려줌", async ({ request }) => {
    const res = await request.get("/api/public/features");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { ok: boolean; flags: Record<string, unknown> };
    expect(body.ok).toBe(true);
    // 공개 플래그만 노출되어야 하며, 관리자 전용 키가 새어 나오면 안 된다.
    expect(body.flags).toHaveProperty("ai_chatbot");
    expect(body.flags).not.toHaveProperty("self_healing");
  });

  // 서버 렌더 컴포넌트라 브라우저 내비게이션 없이 HTML 만 확인한다(dev 컴파일 비용 회피).
  test("blog_category_cta — 블로그 글 하단 카테고리 CTA 노출", async ({ request }) => {
    const listHtml = await (await request.get("/blog", { timeout: 120_000 })).text();
    const slug = listHtml.match(/href="\/blog\/([^"?#]+)"/)?.[1];
    if (!slug) {
      test.skip(true, "로컬 DB에 블로그 글이 없어 건너뜀");
      return;
    }

    const postHtml = await (await request.get(`/blog/${slug}`, { timeout: 120_000 })).text();
    // data-funnel 로 식별 — 문구가 바뀌어도 깨지지 않는다.
    expect(postHtml).toContain('data-funnel="blog_category_cta_primary"');
  });

  test("returning_visitor_badge — 홈이 재방문 상태에서도 정상 렌더", async ({ page }) => {
    // fixtures 가 재방문 상태를 심으므로 배지 로직이 실행되는 경로.
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
