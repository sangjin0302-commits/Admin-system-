/**
 * 신규 기능 순수 로직 계약 검사 — 블로그 정렬 comparator + 아이디찾기 전화 매칭.
 */
import assert from "node:assert/strict";

import { compareBoardCards } from "@/lib/blog/board-sort";
import { phoneTail, samePhone } from "@/lib/auth/phone-match";

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

const card = (pinned: boolean, sortOrder: number, dateMs: number) => ({ pinned, sortOrder, dateMs });

check("전부 비고정이면 최신순", () => {
  const arr = [card(false, 0, 100), card(false, 0, 300), card(false, 0, 200)];
  arr.sort(compareBoardCards);
  assert.deepEqual(arr.map((c) => c.dateMs), [300, 200, 100]);
});

check("고정 글이 최신 비고정보다 앞", () => {
  const arr = [card(false, 0, 999), card(true, 0, 1)];
  arr.sort(compareBoardCards);
  assert.equal(arr[0].pinned, true);
});

check("고정끼리는 sortOrder 작을수록 앞", () => {
  const arr = [card(true, 5, 100), card(true, 1, 100), card(true, 3, 100)];
  arr.sort(compareBoardCards);
  assert.deepEqual(arr.map((c) => c.sortOrder), [1, 3, 5]);
});

check("같은 sortOrder면 최신순 타이브레이크", () => {
  const arr = [card(false, 2, 100), card(false, 2, 400)];
  arr.sort(compareBoardCards);
  assert.equal(arr[0].dateMs, 400);
});

check("phoneTail 국가코드·형식 흡수", () => {
  assert.equal(phoneTail("010-1234-5678"), "12345678");
  assert.equal(phoneTail("+82 10-1234-5678"), "12345678");
  assert.equal(phoneTail("01012345678"), "12345678");
});

check("phoneTail 짧으면 빈 문자열", () => {
  assert.equal(phoneTail("1234"), "");
  assert.equal(phoneTail(""), "");
  assert.equal(phoneTail(null), "");
});

check("samePhone 형식 달라도 같은 회선 매칭", () => {
  assert.equal(samePhone("010-1234-5678", "+821012345678"), true);
  assert.equal(samePhone("010-1111-2222", "010-3333-4444"), false);
  assert.equal(samePhone("", "010-1234-5678"), false); // 무효는 불일치
});

if (failed > 0) {
  console.error(`[blog-portal-helpers] ${failed} 검사 실패`);
  process.exit(1);
}
console.log("[blog-portal-helpers] OK — 정렬 comparator + 전화 매칭 계약 유지.");
