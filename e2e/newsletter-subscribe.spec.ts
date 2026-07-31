import { test, expect } from "./fixtures";

/**
 * 뉴스레터 구독 퍼널 잠금 테스트.
 * 블로그 = 주 마케팅 도구 → 구독 폼 노출 + 구독 API 계약을 고정한다.
 * 깨지면 구독 유입 경로가 사라졌다는 신호.
 */

test.describe("뉴스레터 구독", () => {
  test.beforeAll(async ({ request }) => {
    await request.get("/blog", { timeout: 120_000, failOnStatusCode: false }).catch(() => undefined);
  });

  test("블로그 페이지에 구독 폼이 노출된다", async ({ request }) => {
    const html = await (await request.get("/blog", { timeout: 120_000 })).text();
    expect(html).toContain("새 칼럼을 이메일로 받아보세요");
    expect(html).toContain("구독하기");
  });

  test("잘못된 이메일은 400 INVALID_EMAIL", async ({ request }) => {
    const res = await request.post("/api/public/newsletter/subscribe", {
      data: { email: "not-an-email" }
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe("INVALID_EMAIL");
  });

  test("유효한 이메일은 더블옵트인 시작(ok)", async ({ request }) => {
    const res = await request.post("/api/public/newsletter/subscribe", {
      data: { email: "e2e-subscriber@example.com" }
    });
    // 확인메일 발송(RESEND 미설정 시 graceful) 여부와 무관하게 접수는 ok.
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  test("만료/위조 토큰 확인은 실패 안내 페이지", async ({ request }) => {
    const html = await (await request.get("/newsletter/confirm?token=forged-token-xyz")).text();
    expect(html).toContain("확인 실패");
  });
});
