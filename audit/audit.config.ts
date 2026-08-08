import { defineConfig, devices } from "@playwright/test";

/** 배포된 사이트를 실제 브라우저로 훑는 진단용 설정(webServer 없음). */
export default defineConfig({
  testDir: ".",
  retries: 0,
  workers: 3,
  reporter: "line",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.AUDIT_BASE_URL ?? "https://ethosattorney.com",
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
