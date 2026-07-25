import { test, expect } from "./fixtures";

/**
 * 접수 폼 실제 제출 경로 스모크.
 *
 * /intake 는 단일 페이지 폼(스텝은 시각 구분만)이라 필수 필드를 채우고 바로 제출한다.
 * 가장 돈이 되는 경로이므로 "로드만" 검증하는 intake.spec.ts 와 별도로 둔다.
 *
 * 필수: 업무 분야(카테고리) · 이름 · 연락처 · 이메일 + 동의 체크.
 */
test.describe("Intake 제출", () => {
  // dev 서버는 /api/inquiries 첫 호출에서 라우트를 컴파일하는데, 전체 스위트를
  // 병렬로 돌리면 이 비용이 폼의 12초 클라이언트 타임아웃을 넘긴다(제품 문제 아님).
  // 빈 본문으로 한 번 때려 라우트를 미리 컴파일해 둔다(400 응답이어도 목적 달성).
  test.beforeAll(async ({ request }) => {
    await request
      .post("/api/inquiries", { data: {}, failOnStatusCode: false, timeout: 120_000 })
      .catch(() => undefined);
  });

  test("필수 항목 입력 후 접수 성공", async ({ page }) => {
    await page.goto("/intake");

    // 1) 업무 분야 선택 — 카테고리 카드 버튼 중 첫 번째.
    const categoryCard = page.locator('button[type="button"]').filter({ hasText: /비자|체류|행정|계약|인허가|법인|번역/ }).first();
    if (await categoryCard.count()) {
      await categoryCard.click();
    }

    // 2) 연락처 정보 — placeholder 로 식별 (라벨은 배지가 섞여 있어 불안정).
    await page.locator('input[placeholder*="김민수"]').first().fill("테스트접수");
    await page.locator('input[placeholder="010-0000-0000"]').first().fill("010-1234-5678");
    await page.locator('input[type="email"]').first().fill("e2e-test@example.com");

    // 3) 사건/업무 개요(필수) — 카테고리별 선택 textarea 가 앞에 섞여 있으므로
    //    placeholder 로 필수 항목만 정확히 지정한다.
    await page
      .locator('textarea[placeholder*="현재 상황"]')
      .first()
      .fill("E2E 자동 테스트 접수입니다. 실제 의뢰가 아니며 시스템 점검용으로 생성되었습니다.");

    // 4) 분야별 필수 select — 값이 비어 있는(선택해 주세요) 항목을 첫 실제 옵션으로 채운다.
    //    카테고리마다 필수 항목이 달라 하드코딩 대신 빈 값만 골라 채운다.
    const selects = page.locator("select");
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i);
      if ((await select.inputValue()) !== "") continue;
      const values = await select.locator("option").evaluateAll((opts) =>
        opts.map((o) => (o as HTMLOptionElement).value).filter((v) => v !== "")
      );
      if (values.length > 0) {
        await select.selectOption(values[0]).catch(() => undefined);
      }
    }

    // 5) 동의 체크박스 — 필수 동의 전부 체크.
    const checkboxes = page.locator('input[type="checkbox"]');
    const boxCount = await checkboxes.count();
    for (let i = 0; i < boxCount; i++) {
      const box = checkboxes.nth(i);
      if (await box.isVisible().catch(() => false)) {
        await box.check().catch(() => undefined);
      }
    }

    // 6) 제출.
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /접수하기|Submit/ }).first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // 7) 성공 화면(접수번호) 확인.
    //    dev 서버는 /api/inquiries 첫 호출에서 라우트를 컴파일하느라 폼의
    //    12초 클라이언트 타임아웃을 넘길 수 있다(제품 문제 아님). 그 경우 1회 재제출한다.
    const success = page.getByText(/접수 완료|접수번호|Request submitted|tracking/i).first();
    const timedOut = page.getByText(/요청 시간이 초과|timed out/i).first();

    await expect(success.or(timedOut)).toBeVisible({ timeout: 25_000 });
    if (await timedOut.isVisible().catch(() => false)) {
      await submitButton.click();
    }
    await expect(success).toBeVisible({ timeout: 25_000 });
  });

  test("필수 항목 비우면 제출되지 않음", async ({ page }) => {
    await page.goto("/intake");

    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /접수하기|Submit/ }).first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // HTML5 required 로 막히므로 성공 화면이 뜨면 안 된다.
    await expect(page.getByText(/접수번호|tracking/i)).toHaveCount(0);
  });
});
