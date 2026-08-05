/**
 * 관보 칼럼 초안 골격 계약 잠금.
 * 실행: npx tsx scripts/tests/gazette-column-draft-check.ts
 */
import { buildGazetteColumnDraft } from "../../src/lib/services/gazette-column-draft";
import type { GazetteItem } from "../../src/lib/services/gazette-client";

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  ✕  ${name}`);
  }
}

function item(p: Partial<GazetteItem>): GazetteItem {
  return { id: "x", title: "t", agency: "", category: "", dateMs: 0, url: null, summary: "", ...p };
}

const d = buildGazetteColumnDraft(
  item({ title: "출입국관리법 시행령 개정", agency: "법무부", category: "대통령령", url: "https://x.go.kr/1" })
);

check("제목에 영향 문구", d.title === "출입국관리법 시행령 개정 — 내 사안에 미치는 영향");
check("마크다운 H1", d.markdown.startsWith("# 출입국관리법 시행령 개정"));
check("메타 발령기관 포함", d.markdown.includes("발령기관: 법무부"));
check("원문 링크 포함", d.markdown.includes("원문: https://x.go.kr/1"));
check("서비스 CTA(비자→immigration 라벨)", d.markdown.includes("비자·체류 업무"));
check("섹션 골격 포함", d.markdown.includes("## 무엇이 바뀌었나") && d.markdown.includes("## 지금 확인할 것"));

// 위험 url 차단
const bad = buildGazetteColumnDraft(item({ title: "공고", url: "javascript:alert(1)" }));
check("javascript: url 미포함", !bad.markdown.includes("javascript:"));

// 요약 자동 인용
const withSummary = buildGazetteColumnDraft(
  item({ title: "고시 개정", summary: "체류자격 변경 신고 기한이 30일로 단축됩니다." })
);
check("요약 자동 인용", withSummary.markdown.includes("체류자격 변경 신고 기한이 30일로 단축됩니다."));
check("요약 인용 캡션", withSummary.markdown.includes("관보 요약 자동 인용"));

// 값 없는 줄 생략
const bare = buildGazetteColumnDraft(item({ title: "단순 공고" }));
check("요약 없으면 플레이스홀더", bare.markdown.includes("핵심 변경 내용을 1~2문단"));
check("메타 없으면 발령기관 줄 없음", !bare.markdown.includes("발령기관"));
check("서비스 매칭 없으면 일반 CTA", bare.markdown.includes("관련 사안은 [무료 상담 신청](/intake)"));

if (failed > 0) {
  console.error(`\n[gazette-column-draft] FAILED ${failed}건`);
  process.exit(1);
}
console.log("\n[gazette-column-draft] OK — 칼럼 초안 골격(제목·메타·url가드·서비스CTA·섹션) 계약 유지.");
