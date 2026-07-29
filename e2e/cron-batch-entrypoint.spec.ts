import { test, expect } from "./fixtures";

/**
 * Vercel Cron Jobs 는 스케줄된 경로를 GET 으로 호출한다.
 * 배치 라우트가 POST 만 노출하면 스케줄 크론이 405 로 죽어 자동 번역/동기화가
 * 통째로 멈춘다(과거 회귀). GET 진입점이 살아 있는지(=405 가 아닌지) 잠근다.
 *
 * 인증(Bearer CRON_SECRET) 없이 부르므로 정상 응답은 401 이어야 한다.
 * 여기서 확인하는 건 "메서드가 허용되는가"이지 인증 성공이 아니다.
 */
test.describe("Cron 배치 진입점", () => {
  const GROUP = "/api/cron/batch/content-sync"; // blog-translate 가 포함된 그룹

  test("GET 이 허용됨 (405 아님) — 스케줄 크론이 실제로 실행 가능", async ({ request }) => {
    const res = await request.get(GROUP, { failOnStatusCode: false, timeout: 120_000 });
    expect(res.status()).not.toBe(405);
    // 미인증이므로 401. 최소한 404/405 처럼 라우트/메서드 부재가 아니어야 한다.
    expect([401, 200]).toContain(res.status());
  });

  test("POST 도 여전히 허용 (수동 트리거)", async ({ request }) => {
    const res = await request.post(GROUP, { failOnStatusCode: false, timeout: 120_000 });
    expect(res.status()).not.toBe(405);
    expect([401, 200]).toContain(res.status());
  });
});

/**
 * 배치 디스패처(cron-dispatcher-service)는 각 태스크 라우트를 GET 으로 호출한다.
 * 태스크 라우트가 GET 을 안 받으면 405 로 조용히 죽어 자동화가 멈춘다(회귀).
 * 대부분 GET-only 지만 market-collect·law-health 는 원래 POST-only 라
 * GET alias 를 달았다 — 그 alias 가 유지되는지 잠근다.
 * 미인증(Bearer 없음)이므로 정상 응답은 401. 핵심은 "405 가 아님".
 */
test.describe("Cron 태스크 라우트 GET 수용", () => {
  const TASKS = [
    "/api/cron/market-collect", // 원래 POST-only → GET alias
    "/api/cron/law-health", //     원래 POST-only → GET alias
    "/api/cron/deadline-scan", //  원래 GET-only (대조군)
  ];

  for (const task of TASKS) {
    test(`GET ${task} → 405 아님 (디스패처가 실제 호출 가능)`, async ({ request }) => {
      const res = await request.get(task, { failOnStatusCode: false, timeout: 120_000 });
      expect(res.status()).not.toBe(405);
      expect([401, 200]).toContain(res.status());
    });
  }
});
