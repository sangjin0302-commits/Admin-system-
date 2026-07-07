import assert from "node:assert/strict";

import {
  verifyLaw,
  CITATION_LAW_REGEX,
  CITATION_PRECEDENT_REGEX,
} from "@/lib/services/citation-verifier-service";

function collectMatches(re: RegExp, text: string): string[] {
  const clone = new RegExp(re.source, re.flags);
  return Array.from(text.matchAll(clone)).map((m) => m[0]);
}

// ── 1. LAW_REGEX — 표준 인용 매칭 ────────────────────────
{
  const text = "행정소송법 제12조에 따라 원고적격이 인정된다.";
  const matches = collectMatches(CITATION_LAW_REGEX, text);
  assert.equal(matches.length, 1);
  assert.match(matches[0], /행정소송법/);
}

// ── 2. LAW_REGEX — 다중 인용 및 항 표기 ──────────────────
{
  const text = "행정심판법 제27조 제1항 및 출입국관리법 제60조를 참조하면";
  const matches = collectMatches(CITATION_LAW_REGEX, text);
  assert.equal(matches.length, 2);
}

// ── 3. PRECEDENT_REGEX — 대법원/구합/두 판례 형식 ─────────
{
  const text = "대법원 2018두12345 판결과 서울고등법원 2020구합1234 및 2019나56789 참고";
  const matches = collectMatches(CITATION_PRECEDENT_REGEX, text);
  assert.ok(matches.length >= 3, `found ${matches.length}`);
}

// ── 4. verifyLaw — 알려진 조문 verified ──────────────────
{
  const r = verifyLaw("행정소송법", "12");
  assert.equal(r.status, "verified");
  assert.equal(r.note, "원고적격");
}

// ── 5. verifyLaw — 폐지 조문 deprecated ──────────────────
{
  const r = verifyLaw("출입국관리법", "76");
  assert.equal(r.status, "deprecated");
  assert.match(r.note ?? "", /삭제/);
}

// ── 6. verifyLaw — 미등록 법령은 unknown ────────────────
{
  const r = verifyLaw("가상법", "1");
  assert.equal(r.status, "unknown");
  assert.match(r.note ?? "", /하드코드 조문표에 없음/);
}

// ── 7. verifyLaw — 미등록 조문번호는 unknown ────────────
{
  const r = verifyLaw("행정소송법", "9999");
  assert.equal(r.status, "unknown");
  assert.match(r.note ?? "", /미확인/);
}

// ── 8. 행정심판법 제27조 verified + 청구기간 note ─────────
{
  const r = verifyLaw("행정심판법", "27");
  assert.equal(r.status, "verified");
  assert.equal(r.note, "청구기간");
}

// ── 9. 빈 문자열은 매칭 없음 ─────────────────────────────
{
  assert.equal(collectMatches(CITATION_LAW_REGEX, "").length, 0);
  assert.equal(collectMatches(CITATION_PRECEDENT_REGEX, "").length, 0);
}

// ── 10. LAW_REGEX 는 "법"으로 끝나지 않는 단어 배제 ─────
{
  const text = "행정소송 제12조"; // "법"이 없음
  const matches = collectMatches(CITATION_LAW_REGEX, text);
  assert.equal(matches.length, 0);
}

console.log("citation-verifier-service tests passed");
