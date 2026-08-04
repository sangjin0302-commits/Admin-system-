/**
 * 서비스 CMS override 파서 잠금.
 * 잘못된 입력이 crash 없이 안전하게 폴백(null)되고, 정상 입력은 정확히 파싱됨을 고정.
 */
import assert from "node:assert/strict";

import { parseLineList, parsePairList } from "@/lib/services/service-content-parse";

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

check("parseLineList: 줄당 1항목·빈줄 제외", () => {
  assert.deepEqual(parseLineList("A\n\n  B  \nC"), ["A", "B", "C"]);
});
check("parseLineList: 빈/undefined → null(기본폴백)", () => {
  assert.equal(parseLineList(""), null);
  assert.equal(parseLineList("   \n  "), null);
  assert.equal(parseLineList(undefined), null);
  assert.equal(parseLineList(null), null);
});

check("parsePairList requireBoth: 뒤 있어야 채택(faq/deadlines)", () => {
  const r = parsePairList("질문1 :: 답1\n질문2\n질문3 :: 답3", { requireBoth: true });
  assert.deepEqual(r, [
    { a: "질문1", b: "답1" },
    { a: "질문3", b: "답3" }
  ]); // "질문2"(뒤 없음)는 제외
});
check("parsePairList 기본: 앞만 있으면 채택(process 설명생략 허용)", () => {
  const r = parsePairList("단계1 :: 설명1\n단계2");
  assert.deepEqual(r, [
    { a: "단계1", b: "설명1" },
    { a: "단계2", b: "" }
  ]);
});
check("parsePairList: '::' 여러개면 첫 구분만 앞, 나머지 뒤로 합침", () => {
  const r = parsePairList("Q :: A :: B", { requireBoth: true });
  assert.deepEqual(r, [{ a: "Q", b: "A :: B" }]);
});
check("parsePairList: 빈/유효없음 → null", () => {
  assert.equal(parsePairList(""), null);
  assert.equal(parsePairList("\n\n"), null);
  assert.equal(parsePairList("뒤없음1\n뒤없음2", { requireBoth: true }), null);
});

if (failed > 0) {
  console.error(`[service-content-parse] ${failed} 검사 실패`);
  process.exit(1);
}
console.log("[service-content-parse] OK — 줄/쌍 파서 안전폴백·정상파싱 계약 유지.");
