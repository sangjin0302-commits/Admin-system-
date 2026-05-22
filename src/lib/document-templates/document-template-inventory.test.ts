import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  documentTemplateInventory,
  getDocumentTemplateOfficialSourceStatus,
  getDocumentTemplateOfficialSourceStatusLabel,
  getDocumentTemplateInventoryItem,
  getHighRiskDocumentTemplates,
  listDocumentTemplateInventory
} from "./document-template-inventory";

const expectedIds = [
  "common_power_of_attorney",
  "common_privacy_consent",
  "common_consultation_log",
  "common_case_processing_ledger",
  "admin_appeal_petition",
  "stay_of_execution_application",
  "supplemental_brief",
  "evidence_list",
  "submitted_materials_list",
  "information_disclosure_request",
  "information_disclosure_objection",
  "immigration_integrated_application",
  "stay_extension_application",
  "status_change_application",
  "refugee_status_application"
];

assert.equal(documentTemplateInventory.length, expectedIds.length);
assert.deepEqual(
  new Set(documentTemplateInventory.map((item) => item.id)).size,
  documentTemplateInventory.length
);

for (const id of expectedIds) {
  assert.ok(getDocumentTemplateInventoryItem(id), `${id} should exist`);
}

for (const item of documentTemplateInventory) {
  assert.ok(item.sourceFormat, `${item.id} sourceFormat required`);
  assert.ok(item.conversionStatus, `${item.id} conversionStatus required`);
  assert.ok(item.riskLevel, `${item.id} riskLevel required`);
  assert.ok(item.officialSourceReferenceKo, `${item.id} officialSourceReferenceKo required`);
  assert.equal(typeof item.isManualOnly, "boolean", `${item.id} isManualOnly required`);
  assert.ok(item.verificationMemoKo, `${item.id} verificationMemoKo required`);
  if (!item.latestVerifiedAt) {
    assert.equal(getDocumentTemplateOfficialSourceStatus(item) === "verified", false);
  }
  assert.equal(/\.(hwp|hwpx|docx|pdf|html)$/i.test(item.officialSourceName), false);
  assert.equal(JSON.stringify(item).includes("passportNumber"), false);
  assert.equal(JSON.stringify(item).includes("alienRegistrationNumber"), false);
  assert.equal(JSON.stringify(item).includes("fullAddress"), false);
  assert.equal(JSON.stringify(item).includes("internalMemo"), false);
  assert.equal(JSON.stringify(item).includes("communicationLogs"), false);
}

const highRiskTemplates = getHighRiskDocumentTemplates();
assert.ok(highRiskTemplates.length >= 7);
assert.ok(highRiskTemplates.every((item) => item.riskLevel === "high"));
assert.equal(getDocumentTemplateInventoryItem("admin_appeal_petition")?.riskLevel, "high");
assert.equal(getDocumentTemplateInventoryItem("stay_of_execution_application")?.riskLevel, "high");
assert.equal(getDocumentTemplateInventoryItem("refugee_status_application")?.riskLevel, "high");
for (const item of highRiskTemplates) {
  assert.match(item.verificationMemoKo, /공식 서식 검토/);
  assert.match(item.verificationMemoKo, /업무범위|위험 검토/);
}

const copy = listDocumentTemplateInventory();
copy.pop();
assert.equal(documentTemplateInventory.length, expectedIds.length);

const firstTemplate = getDocumentTemplateInventoryItem("common_power_of_attorney");
assert.equal(firstTemplate?.officialSourceReferenceKo, "정부24 또는 제출기관 공식 서식 확인 필요");
assert.equal(firstTemplate?.verifiedBy, null);
assert.match(firstTemplate?.verificationMemoKo ?? "", /공식 원본 확보 전 placeholder/);

assert.equal(
  getDocumentTemplateOfficialSourceStatus({
    officialSourceName: "공식 출처",
    officialSourceReferenceKo: "공식 출처 후보",
    latestVerifiedAt: "2026-05-22",
    conversionStatus: "not_started",
    isManualOnly: false
  }),
  "verified"
);
assert.equal(
  getDocumentTemplateOfficialSourceStatus({
    officialSourceName: "공식 출처",
    officialSourceReferenceKo: "공식 출처 후보",
    latestVerifiedAt: null,
    conversionStatus: "not_started",
    isManualOnly: false
  }),
  "needs_review"
);
assert.equal(
  getDocumentTemplateOfficialSourceStatus({
    officialSourceName: "",
    officialSourceReferenceKo: "",
    latestVerifiedAt: null,
    conversionStatus: "not_started",
    isManualOnly: false
  }),
  "pending"
);
assert.equal(
  getDocumentTemplateOfficialSourceStatus({
    officialSourceName: "수동 서식",
    officialSourceReferenceKo: "수동 기준",
    latestVerifiedAt: null,
    conversionStatus: "manual_only",
    isManualOnly: false
  }),
  "manual_only"
);
assert.equal(
  getDocumentTemplateOfficialSourceStatus({
    officialSourceName: "수동 서식",
    officialSourceReferenceKo: "수동 기준",
    latestVerifiedAt: "2026-05-22",
    conversionStatus: "verified",
    isManualOnly: true
  }),
  "manual_only"
);
assert.equal(getDocumentTemplateOfficialSourceStatusLabel("verified"), "공식 출처 확인");
assert.equal(getDocumentTemplateOfficialSourceStatusLabel("pending"), "공식 출처 미확인");
assert.equal(getDocumentTemplateOfficialSourceStatusLabel("needs_review"), "최신성 확인 필요");
assert.equal(getDocumentTemplateOfficialSourceStatusLabel("manual_only"), "수동 작성 유지");

const source = readFileSync(
  join(process.cwd(), "src/lib/document-templates/document-template-inventory.ts"),
  "utf8"
);
for (const forbidden of [
  "자동 제출",
  "고객 발송 가능",
  "즉시 제출",
  "법률 판단 완료",
  "HWP 생성 가능",
  "DOCX export 가능",
  "PDF export 가능",
  "drive.google.com",
  "docs.google.com",
  "C:\\",
  "/Users/",
  "/mnt/",
  "passportNumber",
  "alienRegistrationNumber",
  "fullAddress"
]) {
  assert.equal(source.includes(forbidden), false, `Forbidden wording found: ${forbidden}`);
}

console.log("document template inventory tests passed");
