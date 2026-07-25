import { test, expect } from "./fixtures";

/**
 * 외부 uptime 모니터가 물고 있는 계약. 깨지면 장애를 놓치므로 회귀를 막는다.
 * - 인증 없이 200
 * - { ok, db } 형태 유지
 * - 내부 정보(스택·버전·env) 미노출
 */
test.describe("헬스체크", () => {
  // dev 서버는 첫 호출에서 라우트를 컴파일하느라 요청 타임아웃을 넘길 수 있다(제품 문제 아님).
  // 미리 한 번 때려 컴파일을 끝내 둔다.
  test.beforeAll(async ({ request }) => {
    await request.get("/api/health", { timeout: 120_000, failOnStatusCode: false }).catch(() => undefined);
  });

  test("인증 없이 200 + ok:true", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as { ok?: boolean; db?: string; latencyMs?: number };
    expect(body.ok).toBe(true);
    expect(body.db).toBe("up");
    expect(typeof body.latencyMs).toBe("number");
  });

  test("HEAD 요청도 200", async ({ request }) => {
    const res = await request.head("/api/health");
    expect(res.status()).toBe(200);
  });

  test("캐시되지 않음 — 모니터가 항상 실시간 상태를 받음", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.headers()["cache-control"]).toContain("no-store");
  });

  test("내부 정보 미노출", async ({ request }) => {
    const res = await request.get("/api/health");
    const text = await res.text();
    expect(text).not.toMatch(/stack|DATABASE_URL|prisma|node_modules|at \w+ \(/i);
  });
});
