import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  documentTemplateInventory,
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

const copy = listDocumentTemplateInventory();
copy.pop();
assert.equal(documentTemplateInventory.length, expectedIds.length);

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
  "PDF export 가능"
]) {
  assert.equal(source.includes(forbidden), false, `Forbidden wording found: ${forbidden}`);
}

console.log("document template inventory tests passed");
