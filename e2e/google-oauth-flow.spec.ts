import { test, expect } from "./fixtures";

/**
 * Google Workspace(Drive·Docs·Meet) 연동은 OAuth state 쿠키로 CSRF 를 막는다.
 * 과거 회귀: google-services 페이지가 connect-url API 로 URL 만 받아
 * window.location 이동 → state 쿠키 미세팅 → 콜백에서 "state mismatch".
 *
 * 잠그는 것:
 *  1) /api/auth/google/start 는 authorize URL 로 302 하며 g_oauth_state 쿠키를 심는다.
 *  2) from=google-services 를 주면 g_oauth_from 쿠키도 심는다(연결 후 복귀 경로).
 *  3) 콜백에 state 불일치로 오면 명확히 400 "state mismatch" 로 거절한다(회귀 감지).
 *
 * 인증(admin) 없이 부르지만 start/callback 은 공개 라우트다.
 */
test.describe("Google OAuth 연결 흐름", () => {
  test("start 가 state 쿠키를 심고 authorize URL 로 리디렉트", async ({ request }) => {
    const res = await request.get("/api/auth/google/start?from=google-services", {
      failOnStatusCode: false,
      maxRedirects: 0,
      timeout: 60_000,
    });

    // 환경변수 미설정(503)이면 이 환경에선 검증 스킵.
    if (res.status() === 503) {
      test.skip(true, "GOOGLE_* 환경변수 미설정 환경");
      return;
    }

    // authorize 로 302/307 리디렉트여야 한다.
    expect([302, 307]).toContain(res.status());
    const location = res.headers()["location"] ?? "";
    expect(location).toContain("accounts.google.com");

    // state / from 쿠키가 세팅돼야 한다.
    const setCookie = res.headers()["set-cookie"] ?? "";
    expect(setCookie).toContain("g_oauth_state=");
    expect(setCookie).toContain("g_oauth_from=");
  });

  test("콜백에 state 불일치면 400 으로 거절 (CSRF 방어)", async ({ request }) => {
    // 쿠키 없이 임의 state 로 콜백 진입 → state mismatch.
    const res = await request.get(
      "/api/auth/google/callback?code=dummy&state=forged-state-value",
      { failOnStatusCode: false, maxRedirects: 0, timeout: 60_000 }
    );
    expect(res.status()).toBe(400);
    const body = await res.json().catch(() => ({}));
    expect(body?.error).toBe("state mismatch");
  });
});
