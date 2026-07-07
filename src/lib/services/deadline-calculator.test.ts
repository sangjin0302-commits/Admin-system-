import assert from "node:assert/strict";

import {
  calculateDeadline,
  calculateAllApplicableDeadlines,
  type DeadlineType
} from "@/lib/services/deadline-calculator";

// ── 1. ADMIN_APPEAL 90일 기본 계산 ──────────────────────────
{
  const disposition = new Date();
  disposition.setDate(disposition.getDate() - 10); // 10일 전 처분
  const r = calculateDeadline(disposition, "ADMIN_APPEAL");
  assert.equal(r.label, "행정심판");
  assert.match(r.basis, /90일/);
  // 90 - 10 = 남은 80일 (오차 1일 허용)
  assert.ok(r.daysRemaining >= 79 && r.daysRemaining <= 81, `daysRemaining=${r.daysRemaining}`);
  assert.equal(r.isExpired, false);
}

// ── 2. OBJECTION_APPEAL 60일 규칙 ──────────────────────────
{
  const disposition = new Date();
  disposition.setDate(disposition.getDate() - 30);
  const r = calculateDeadline(disposition, "OBJECTION_APPEAL");
  assert.equal(r.label, "이의신청");
  assert.match(r.basis, /60일/);
  assert.ok(r.daysRemaining >= 29 && r.daysRemaining <= 31);
}

// ── 3. 만료 판정 (isExpired) ──────────────────────────────
{
  const disposition = new Date();
  disposition.setDate(disposition.getDate() - 200); // 200일 전
  const r = calculateDeadline(disposition, "ADMIN_APPEAL");
  assert.equal(r.isExpired, true);
  assert.ok(r.daysRemaining < 0);
}

// ── 4. 1년 취소소송 장기 규칙 ─────────────────────────────
{
  const disposition = new Date();
  disposition.setDate(disposition.getDate() - 100);
  const r = calculateDeadline(disposition, "REVOCATION_LAWSUIT_1YEAR");
  assert.equal(r.isExpired, false);
  assert.match(r.basis, /1년/);
}

// ── 5. 재조사청구 90일 ────────────────────────────────────
{
  const r = calculateDeadline(new Date(), "REINVESTIGATION");
  assert.equal(r.label, "재조사청구");
}

// ── 6. calculateAllApplicableDeadlines - APPEAL 카테고리 ──
{
  const list = calculateAllApplicableDeadlines(new Date(), "APPEAL_CASE");
  const types = list.map((d) => d.type);
  assert.ok(types.includes("OBJECTION_APPEAL"));
  assert.ok(types.includes("ADMIN_APPEAL"));
  assert.ok(types.includes("REVOCATION_LAWSUIT"));
  assert.equal(list.length, 4);
}

// ── 7. VISA 카테고리 - 2개 규칙만 ─────────────────────────
{
  const list = calculateAllApplicableDeadlines(new Date(), "VISA_STAY");
  assert.equal(list.length, 2);
  const types: DeadlineType[] = list.map((d) => d.type);
  assert.deepEqual(types.sort(), ["ADMIN_APPEAL", "OBJECTION_APPEAL"].sort());
}

// ── 8. null 카테고리 - 기본 fallback ──────────────────────
{
  const list = calculateAllApplicableDeadlines(new Date(), null);
  assert.equal(list.length, 2);
}

// ── 9. 소문자 카테고리도 처리 ──────────────────────────────
{
  const list = calculateAllApplicableDeadlines(new Date(), "appeal");
  assert.equal(list.length, 4);
}

// ── 10. 각 결과에 deadline Date 포함 ──────────────────────
{
  const list = calculateAllApplicableDeadlines(new Date(), "LICENSE");
  for (const d of list) {
    assert.ok(d.deadline instanceof Date);
    assert.equal(typeof d.daysRemaining, "number");
    assert.equal(typeof d.isExpired, "boolean");
  }
}

console.log("deadline-calculator tests passed");
