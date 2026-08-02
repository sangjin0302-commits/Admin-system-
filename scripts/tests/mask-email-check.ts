/**
 * 아이디 찾기 이메일 마스킹 계약 검사.
 * 짧은 로컬파트가 전체 노출되지 않는지 등 보안 경계를 고정한다.
 */
import assert from "node:assert/strict";

import { maskEmail } from "@/lib/auth/mask-email";

let failed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL ${name}:`, err instanceof Error ? err.message : err);
  }
}

check("일반 이메일은 앞 2자만 노출", () => {
  const m = maskEmail("attorney@gmail.com");
  assert.equal(m, "at******@gmail.com");
  assert.ok(m.startsWith("at"));
  assert.ok(m.includes("@gmail.com"));
});

check("로컬 2자 이하는 아무것도 노출 안 함", () => {
  assert.equal(maskEmail("ab@x.com"), "**@x.com");
  assert.equal(maskEmail("a@x.com"), "**@x.com");
});

check("+ 별칭도 로컬 전체를 드러내지 않음", () => {
  const m = maskEmail("user+tag@gmail.com");
  assert.equal(m, "us******@gmail.com");
  assert.ok(!m.includes("tag"));
});

check("도메인은 유지", () => {
  assert.ok(maskEmail("someone@company.co.kr").endsWith("@company.co.kr"));
});

check("이상 입력은 안전한 기본값", () => {
  assert.equal(maskEmail("nope"), "***");
  assert.equal(maskEmail("@x.com"), "***");
});

if (failed > 0) {
  console.error(`[mask-email] ${failed} 검사 실패`);
  process.exit(1);
}
console.log("[mask-email] OK — 이메일 마스킹 경계 유지(짧은 로컬 비노출·도메인 유지).");
