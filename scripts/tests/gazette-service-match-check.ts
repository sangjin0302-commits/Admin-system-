/**
 * 관보 → 서비스 CTA 매칭 계약 잠금.
 * 실행: npx tsx scripts/tests/gazette-service-match-check.ts
 */
import { matchGazetteService } from "../../src/lib/services/gazette-service-match";

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.error(`  ✕  ${name}`);
  }
}

// 비자 관련 관보 → immigration 서비스
const visa = matchGazetteService({ title: "출입국관리법 시행령 일부개정령", agency: "법무부", category: "대통령령" });
check("비자/출입국 → /services/immigration", visa?.href === "/services/immigration");

// 인허가 관련 → license
const lic = matchGazetteService({ title: "건축물 관리법에 따른 허가 기준 고시", agency: "국토교통부", category: "고시" });
check("건축·허가 → /services/license", lic?.href === "/services/license");

// 법인 → corporate
const corp = matchGazetteService({ title: "상법상 주식회사 설립 등기 관련 공고", agency: "법원행정처", category: "공고" });
check("법인·설립 → /services/corporate", corp?.href === "/services/corporate");

// 행정심판 → appeal
const appeal = matchGazetteService({ title: "행정심판 재결례 공개 안내", agency: "국민권익위원회", category: "공고" });
check("행정심판 → /services/appeal", appeal?.href === "/services/appeal");

// 무관/분류불가 → null (노이즈 방지)
const none = matchGazetteService({ title: "일반 예산 집행 지침 통보", agency: "기획재정부", category: "훈령" });
check("분류 불가 → null", none === null);

// 제목 없음 → null
check("빈 제목 → null", matchGazetteService({ title: "" }) === null);

// 영어 라벨
const en = matchGazetteService({ title: "출입국관리법 시행령 일부개정령", agency: "법무부" }, "en");
check("en 라벨 반환", en?.label === "Visa & Residency");

if (failed > 0) {
  console.error(`\n[gazette-service-match] FAILED ${failed}건`);
  process.exit(1);
}
console.log("\n[gazette-service-match] OK — 관보→서비스 매핑 계약 유지(분야 매칭·other 제외·언어라벨).");
