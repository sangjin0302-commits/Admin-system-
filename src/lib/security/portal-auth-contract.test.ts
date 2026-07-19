/**
 * 포털 인증 계약 고정 테스트.
 *
 * 이 프로젝트에서 실제로 터졌던 사고: 포털 라우트들이 신원을 세션이 아니라
 * `?userId=` / `?email=` / `x-portal-user` 헤더 / 본문 `userId` 에서 읽었다.
 * middleware matcher 에 `/api/portal` 이 없어 인증 게이트도 없었으므로,
 * 남의 이메일만 알면 남의 구독을 해지하고 상담 내역을 읽을 수 있었다.
 *
 * 아래를 코드로 못 박는다.
 *   1. 포털 라우트 소스에 클라이언트 제공 신원을 읽는 흔적이 남아 있지 않을 것
 *   2. 인증이 필요한 포털 라우트는 requirePortalUser 를 거칠 것
 *   3. cron 라우트는 CRON_SECRET 미설정 시 반드시 거부할 것
 *      (`Bearer ${process.env.CRON_SECRET}` 만 비교하면 "Bearer undefined" 로 통과한다)
 */

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

/** 로그인한 본인만 접근해야 하는 포털 라우트. */
const AUTHED_PORTAL_ROUTES = [
  "src/app/api/portal/concierge/route.ts",
  "src/app/api/portal/international-services/route.ts",
  "src/app/api/portal/payments/checkout/route.ts",
  "src/app/api/portal/payments/confirm/route.ts",
  "src/app/api/portal/payments/create-session/route.ts",
  "src/app/api/portal/sign/route.ts",
  "src/app/api/portal/subscription/route.ts",
  "src/app/api/portal/survey/[caseId]/route.ts",
  "src/app/api/portal/vip/route.ts",
  "src/app/api/public/ai-subscription/subscribe/route.ts"
];

/** 호출자가 마음대로 정할 수 있는 신원 소스 — 라우트가 이걸 읽으면 안 된다. */
const CLIENT_CONTROLLED_IDENTITY = [
  'searchParams.get("userId")',
  'searchParams.get("email")',
  'searchParams.get("clientId")',
  '"x-portal-user"',
  '"x-user-email"'
];

function read(rel: string): string {
  const full = path.join(ROOT, rel);
  assert.ok(existsSync(full), `파일이 없다: ${rel}`);
  return readFileSync(full, "utf8");
}

async function main() {
  // ── 1) 포털 라우트가 클라이언트 제공 신원을 읽지 않는다 ──
  for (const rel of AUTHED_PORTAL_ROUTES) {
    const src = read(rel);
    for (const needle of CLIENT_CONTROLLED_IDENTITY) {
      assert.ok(
        !src.includes(needle),
        `${rel} 이 클라이언트가 정하는 신원(${needle})을 읽고 있다 — 세션에서만 얻어야 한다`
      );
    }
  }

  // ── 2) 인증 헬퍼를 실제로 거친다 ──
  for (const rel of AUTHED_PORTAL_ROUTES) {
    const src = read(rel);
    assert.ok(
      src.includes("requirePortalUser") || src.includes("getPortalUser"),
      `${rel} 에 포털 인증 검사가 없다`
    );
  }

  // ── 3) 결제 승인은 저장된 주문 금액과 대조한다 ──
  const confirmSrc = read("src/app/api/portal/payments/confirm/route.ts");
  assert.ok(
    confirmSrc.includes("order.amount !== amount"),
    "결제 승인이 본문 금액만 믿고 있다 — 저장된 주문 금액과 대조해야 한다"
  );

  // ── 4) 결제 수단 미설정 시 프로덕션에서 mock 승인을 내주지 않는다 ──
  const paymentSrc = read("src/lib/services/payment-service.ts");
  assert.ok(
    paymentSrc.includes('process.env.NODE_ENV === "production"'),
    "TOSS_SECRET_KEY 미설정 시 프로덕션에서도 success 를 반환하고 있다"
  );

  // ── 5) cron 라우트는 시크릿 미설정 시 무조건 거부한다 ──
  const cronDir = path.join(ROOT, "src/app/api/cron");
  const entries = await readdir(cronDir, { withFileTypes: true });
  let checked = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const rel = `src/app/api/cron/${entry.name}/route.ts`;
    if (!existsSync(path.join(ROOT, rel))) continue;
    const src = read(rel);
    if (!src.includes("CRON_SECRET")) continue;
    checked += 1;
    assert.ok(
      src.includes("!cronSecret") || src.includes("!process.env.CRON_SECRET"),
      `${rel} 이 CRON_SECRET 미설정을 막지 않는다 — "Bearer undefined" 로 통과된다`
    );
  }
  assert.ok(checked > 0, "검사한 cron 라우트가 없다 — 경로가 바뀌었는지 확인 필요");

  console.log(`portal auth contract tests passed (cron routes checked: ${checked})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
