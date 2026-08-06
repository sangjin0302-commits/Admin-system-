import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 공개 루트(/) 컴플라이언스 가드.
 *
 * 이 파일은 UI 모델이 없다(루트는 마케팅 페이지 컴포넌트를 직접 렌더). 예전엔 필수토큰
 * (컴포넌트명·문구·href)을 grep 해 리팩터마다 깨졌다. 그 brittle 부분은 제거하고,
 * **금지토큰만** 남긴다. 금지토큰 스캔은 리팩터에 안 깨진다(위반을 새로 넣을 때만 실패)
 * — 즉 회귀 방지 가치는 유지하면서 유지보수 부담은 0.
 *
 * 지키는 것:
 *   1) 관리자 내부식별자/시크릿이 공개 루트에 유출되지 않음.
 *   2) 행정사 광고 규정상 금지되는 과장광고("100% 허가", "결과 보장" 등)가 없음.
 */

const root = process.cwd();
const rootPageSource = readFileSync(join(root, "src/app/page.tsx"), "utf8");
const marketingSource = readFileSync(join(root, "src/lib/services/public-marketing-pages.ts"), "utf8");

// 1) 내부 식별자 · 시크릿 · 관리자 링크 유출 금지 (공개 루트).
const FORBIDDEN_LEAK_TOKENS = [
  "inquiryId",
  "caseId",
  "workflowStatus",
  "bridgeWorkflowStatus",
  "Lawbot",
  "adminNote",
  "communicationLogs",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "EMAIL_ALLOWED_FROM_DOMAIN",
  "ADMIN_BASIC_AUTH_PASSWORD",
  'href="/admin"'
];
for (const forbidden of FORBIDDEN_LEAK_TOKENS) {
  assert.equal(rootPageSource.includes(forbidden), false, `루트 유출 금지 토큰: ${forbidden}`);
}

// 2) 과장광고 금지 (행정사 광고 규정 컴플라이언스). 루트 + 마케팅 콘텐츠 양쪽 스캔.
const FORBIDDEN_MARKETING_CLAIMS = [
  "100% 허가",
  "확실한 해결",
  "즉시 수임",
  "결과 보장",
  "무조건 가능",
  "최단기간 보장"
];
for (const forbidden of FORBIDDEN_MARKETING_CLAIMS) {
  assert.equal(rootPageSource.includes(forbidden), false, `루트 과장광고 금지: ${forbidden}`);
  assert.equal(marketingSource.includes(forbidden), false, `마케팅 과장광고 금지: ${forbidden}`);
}

console.log("public root gateway compliance tests passed");
