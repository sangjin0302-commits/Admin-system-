import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  // Windows Next dev 콜드 컴파일이 30s를 종종 넘김 — flake 방지용 60s.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    // 개별 액션 타임아웃도 살짝 상향 (SSR + Sentry 미들웨어 오버헤드 대응).
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        port: 3000,
        reuseExistingServer: true,
      },
});
