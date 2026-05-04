import assert from "node:assert/strict";

import { buildIntakeCategoryDetailSummary } from "@/lib/services/intake-category-detail-summary";

const summary = buildIntakeCategoryDetailSummary(`자동차 이전등록 상담을 원합니다.

[업무 분야]
기타 민원

[분야별 세부사항]
- 희망 상담 방식: 전화 상담
- 희망 언어: 한국어
- 관련 서류 보유 여부: 관련 서류 보유
- 민원 세부 유형: 자동차 등록
- 대상 기관: 차량등록사업소
- 차량 구분: 이전
- 차량 소유자 구분: 외국인
- 비어있는 값: 
- null 값: null
- undefined 값: undefined`);

assert.equal(summary.categoryLabel, "기타 민원");
assert.equal(summary.subtypeLabel, "자동차 등록");
assert.equal(summary.consultationMethod, "전화 상담");
assert.equal(summary.preferredLanguage, "한국어");
assert.equal(summary.documentAvailability, "관련 서류 보유");
assert.equal(summary.cleanedDescription, "자동차 이전등록 상담을 원합니다.");
assert.deepEqual(summary.detailRows, [
  { label: "대상 기관", value: "차량등록사업소" },
  { label: "차량 구분", value: "이전" },
  { label: "차량 소유자 구분", value: "외국인" }
]);

const empty = buildIntakeCategoryDetailSummary("일반 문의입니다.");
assert.equal(empty.categoryLabel, null);
assert.equal(empty.cleanedDescription, "일반 문의입니다.");
assert.deepEqual(empty.detailRows, []);

const rowText = summary.detailRows.map((row) => `${row.label}: ${row.value}`).join("\n");
assert.equal(rowText.includes("undefined 값"), false);
assert.equal(rowText.includes("null 값"), false);
