import { test as base } from "@playwright/test";

/**
 * 공용 e2e fixture.
 *
 * 첫방문 스플래시(brand-intro, `ethos_intro_seen`)와 온보딩 투어
 * (onboarding-tour, `ethos_onboarded`)는 세션당 1회 전체화면/오버레이로 떠
 * 클릭을 가로챈다. 플래그가 켜지면 클릭 기반 테스트가 깨지므로, 모든 페이지
 * 로드 전에 sessionStorage 플래그를 심어 오버레이를 확정적으로 우회한다.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        window.sessionStorage.setItem("ethos_intro_seen", "1");
        window.sessionStorage.setItem("ethos_onboarded", "1");
      } catch {
        /* sessionStorage 접근 불가 환경은 무시 */
      }
    });
    await use(page);
  },
});

export { expect, devices } from "@playwright/test";
