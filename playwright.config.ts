import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // CI 재시도 1회. 2회일 때는 실패 1건이 timeout(120s) × 3 = 6분을 먹어, 몇 개만 깨져도
  // 잡 제한시간을 통째로 잡아먹었다(실제로 60.3분에 잘림). 플레이크 흡수엔 1회로 충분하다.
  retries: process.env.CI ? 1 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  // Windows Next dev 콜드 컴파일이 30s를 종종 넘김 — flake 방지용 60s.
  // CI 는 120s: 예전엔 CSP 버그로 사이트 JS 가 통째로 차단돼 페이지가 "빈 껍데기"로
  // 즉시 로드됐고 그래서 짧은 타임아웃으로도 통과했다. CSP 를 고쳐 하이드레이션이
  // 실제로 돌기 시작하자 러너(2~4 vCPU 에 next start + Chromium 동거)에서 시간이 모자랐다.
  timeout: process.env.CI ? 120_000 : 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    // 개별 액션 타임아웃도 살짝 상향 (SSR + Sentry 미들웨어 오버헤드 대응).
    actionTimeout: 15_000,
    // navigation 은 CI 에서 90s. 같은 스펙들을 배포된 사이트(ethosattorney.com)에
    // 그대로 돌리면 17개가 전부 통과하므로 제품 문제가 아니라 러너 성능 보정이다.
    navigationTimeout: process.env.CI ? 90_000 : 45_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // CI 는 빌드된 prod 서버(next start)를, 로컬은 dev 서버를 자동 기동한다.
  // 이전엔 CI 에서 webServer=undefined 라 서버가 안 떠 e2e 가 전부 연결실패했음.
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
