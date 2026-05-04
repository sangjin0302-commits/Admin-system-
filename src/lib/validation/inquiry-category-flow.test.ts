import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { toPublicInquiryResponse } from "@/app/api/inquiries/route-safe-v3";
import { parseCreateInquiryInput } from "@/lib/validation/inquiry-safe";

const basePayload = {
  preferredLocale: "ko",
  clientType: "INDIVIDUAL",
  contactName: "홍길동",
  email: "client@example.com",
  phone: "010-0000-0000",
  title: "비자 상담 요청",
  description: "현재 체류 자격 변경이 필요해서 상담을 요청합니다.",
  requestedOutcome: "진행 가능성 확인",
  declaredUrgency: "HIGH",
  consentToPrivacy: true,
  website: ""
} as const;

assert.throws(
  () => parseCreateInquiryInput(basePayload),
  /업무 분야를 선택해 주세요/,
  "category 없이 public intake submit이 통과하면 안 됩니다."
);

const parsed = parseCreateInquiryInput({
  ...basePayload,
  category: "visa",
  categoryDetails: {
    nationality: "이집트",
    currentVisaStatus: "D-10",
    desiredVisaType: "E-7",
    documentAvailability: "관련 서류 보유"
  }
});

assert.equal(parsed.requestedInquiryType, "FOREIGNER_VISA");
assert.equal(parsed.nationality, "이집트");
assert.equal(parsed.currentStatus, "D-10");
assert.match(parsed.description, /업무 분야/);
assert.match(parsed.description, /비자/);
assert.match(parsed.description, /국적: 이집트/);
assert.match(parsed.description, /현재 체류 자격: D-10/);
assert.match(parsed.description, /희망 비자 종류: E-7/);

const publicResponse = toPublicInquiryResponse({} as never);
const publicResponseJson = JSON.stringify(publicResponse);
assert.equal(publicResponse.received, true);
assert.match(publicResponseJson, /접수가 완료되었습니다/);
for (const blocked of ["id", "caseId", "workflowStatus", "bridgeWorkflowStatus", "lawbot"]) {
  assert.equal(publicResponseJson.includes(blocked), false, `${blocked} must not be public`);
}

const root = process.cwd();
const middlewareSource = readFileSync(join(root, "middleware.ts"), "utf8");
assert.match(middlewareSource, /pathname\.startsWith\("\/admin"\)/);
assert.match(middlewareSource, /pathname\.startsWith\("\/api\/admin"\)/);
assert.match(middlewareSource, /"\/intake\/:path\*"/);
assert.match(middlewareSource, /"\/api\/inquiries"/);
assert.equal(middlewareSource.includes("ADMIN_INGEST_PATH"), false);
assert.equal(middlewareSource.includes("pathname !=="), false);

const intakeFormSource = readFileSync(
  join(root, "src/components/intake/intake-form-safe-v3.tsx"),
  "utf8"
);
const intakeCategorySource = readFileSync(join(root, "src/types/intake-category.ts"), "utf8");
for (const label of [
  "비자",
  "법인",
  "행정심판",
  "사실조사 및 계약서 작성",
  "인허가",
  "기타 아랍어 번역",
  "categoryDetails",
  "업무 분야를 먼저 선택해 주세요."
]) {
  assert.match(`${intakeFormSource}\n${intakeCategorySource}`, new RegExp(label));
}
assert.equal(intakeFormSource.includes("run-lawbot-workflow"), false);
assert.equal(intakeFormSource.includes("client-message-service"), false);

const routeSource = readFileSync(join(root, "src/app/api/inquiries/route-safe-v3.ts"), "utf8");
assert.equal(routeSource.includes("id: inquiry.id"), false);
assert.equal(routeSource.includes("workflowStatus"), false);
assert.equal(routeSource.includes("updatedBy:"), false);
assert.equal(routeSource.includes("controlSource:"), false);
