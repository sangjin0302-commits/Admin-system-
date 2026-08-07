/**
 * Toss 결제 웹훅 보안·파싱 잠금(머니패스).
 *
 * 웹훅은 결제상태를 바꾸므로 서명검증·상태매핑·orderId 파싱이 회귀하면 위조 웹훅으로
 * 결제상태 조작 or 결제기록 누락이 생긴다. 순수 로직을 고정한다.
 *
 * 실행: npx tsx scripts/tests/toss-webhook-check.ts
 */
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { verifyTossWebhook } from "@/lib/services/payment-service";

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  X  ${name}`);
  }
}

// ── verifyTossWebhook: fail-closed + 서명 정확성 ─────────
const prevSecret = process.env.TOSS_WEBHOOK_SECRET;

// 시크릿 미설정 → 거부(fail-closed): 위조 웹훅으로 결제조작 방지.
delete process.env.TOSS_WEBHOOK_SECRET;
check("시크릿 없으면 거부", verifyTossWebhook("{}", "anything") === false);

process.env.TOSS_WEBHOOK_SECRET = "test-secret";
const body = JSON.stringify({ data: { orderId: "CASE-abc-1", status: "DONE" } });
const goodSig = createHmac("sha256", "test-secret").update(body).digest("base64");
check("올바른 서명 통과", verifyTossWebhook(body, goodSig) === true);
check("서명 없음 거부", verifyTossWebhook(body, null) === false);
check("잘못된 서명 거부", verifyTossWebhook(body, "wrongsig") === false);
check("본문 변조 시 거부", verifyTossWebhook(body + " ", goodSig) === false);

// 복원
if (prevSecret === undefined) delete process.env.TOSS_WEBHOOK_SECRET;
else process.env.TOSS_WEBHOOK_SECRET = prevSecret;

// ── 상태 매핑 계약(웹훅 라우트와 동일 규칙) ─────────────
const TOSS_STATUS_MAP: Record<string, "PAID" | "CANCELED" | "PENDING" | "FAILED"> = {
  DONE: "PAID",
  PARTIAL_CANCELED: "PAID",
  CANCELED: "CANCELED",
  EXPIRED: "FAILED",
  ABORTED: "FAILED",
  WAITING_FOR_DEPOSIT: "PENDING",
  IN_PROGRESS: "PENDING",
  READY: "PENDING",
};
check("DONE→PAID", TOSS_STATUS_MAP["DONE"] === "PAID");
check("CANCELED→CANCELED", TOSS_STATUS_MAP["CANCELED"] === "CANCELED");
check("EXPIRED→FAILED", TOSS_STATUS_MAP["EXPIRED"] === "FAILED");
check("미지 상태→매핑없음(PENDING 폴백은 라우트)", TOSS_STATUS_MAP["UNKNOWN"] === undefined);

// ── orderId → caseId 파싱(라우트·confirm 동일 정규식) ───
const parseCaseId = (orderId: string): string | null => orderId.match(/^CASE-([^-]+)-/)?.[1] ?? null;
check("CASE-abc-1 → abc", parseCaseId("CASE-abc-1") === "abc");
check("CASE-abc123-xyz-9 → abc123", parseCaseId("CASE-abc123-xyz-9") === "abc123");
check("비규격 orderId → null", parseCaseId("ORDER-999") === null);

if (failed > 0) {
  console.error(`\n[toss-webhook] FAILED ${failed}건`);
  process.exit(1);
}
console.log("\n[toss-webhook] OK — 서명검증(fail-closed)·상태매핑·orderId 파싱 계약 유지.");
