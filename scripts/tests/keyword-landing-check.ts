/**
 * 키워드 랜딩 자동확장 — 순수 헬퍼 계약 잠금.
 * 실행: npx tsx scripts/tests/keyword-landing-check.ts
 */
import {
  isValidKeywordSlug,
  slugifyQuery,
  deriveTokens,
} from "../../src/lib/services/keyword-landing-service";

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  ✕  ${name}`);
  }
}

// 슬러그 검증 — 한글 허용, 공백/특수문자 거부
check("한글 슬러그 허용", isValidKeywordSlug("귀화"));
check("영숫자-하이픈 허용", isValidKeywordSlug("d-8-비자"));
check("빈 문자열 거부", !isValidKeywordSlug(""));
check("공백 포함 거부", !isValidKeywordSlug("d 8"));
check("선행 하이픈 거부", !isValidKeywordSlug("-visa"));

// slugify — 공백→하이픈, 특수문자 제거, 소문자
check("공백→하이픈", slugifyQuery("F-2-7 점수제") === "f-2-7-점수제");
check("특수문자 제거", slugifyQuery("D-8?? 비자!!") === "d-8-비자");
check("영문 소문자화", slugifyQuery("Work Visa") === "work-visa");
check("빈 입력 → 빈 슬러그", slugifyQuery("   ") === "");
check("slugify 결과는 유효 슬러그", isValidKeywordSlug(slugifyQuery("귀화 국적")));

// 토큰 — 원문 + 2자 이상 조각, 중복 제거
const tk = deriveTokens("F-2-7 점수제 거주");
check("원문 토큰 포함", tk.includes("F-2-7 점수제 거주"));
check("조각 토큰 포함", tk.includes("점수제") && tk.includes("거주"));
check("빈 입력 → 빈 토큰", deriveTokens("  ").length === 0);

if (failed > 0) {
  console.error(`\n[keyword-landing] FAILED ${failed}건`);
  process.exit(1);
}
console.log("\n[keyword-landing] OK — 슬러그(한글허용)·slugify·토큰 계약 유지.");
