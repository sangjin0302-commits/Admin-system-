import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { DocumentTemplateInventoryItem } from "./document-template-inventory";
import {
  buildDocumentTemplateReadiness,
  buildDocumentTemplateReadinessSummary,
  documentTemplateReadinessCheckDefinitions
} from "./document-template-readiness";

const baseTemplate = {
  id: "qa_template",
  titleKo: "QA 서식",
  category: "common",
  sourceFormat: "hwp",
  sourceAssetStatus: "source_collected",
  canonicalFormatCandidate: ["hwpx"],
  conversionStatus: "verified",
  riskLevel: "medium",
  requiredFields: ["client.name"],
  optionalFields: ["case.memo"],
  officialSourceName: "QA 공식 출처",
  officialSourceReferenceKo: "QA 공식 출처 확인 기록",
  latestVerifiedAt: "2026-05-22",
  verifiedBy: "QA Reviewer",
  verificationMemoKo: "QA 공식 출처 확인 fixture입니다.",
  isManualOnly: false,
  notesKo: "QA only"
} satisfies DocumentTemplateInventoryItem;

const checkIds = documentTemplateReadinessCheckDefinitions.map((check) => check.id);
assert.equal(new Set(checkIds).size, checkIds.length);
for (const check of documentTemplateReadinessCheckDefinitions) {
  assert.ok(check.labelKo, `${check.id} should have labelKo`);
}

assert.equal(
  buildDocumentTemplateReadiness({
    ...baseTemplate,
    sourceAssetStatus: "source_needed"
  }).status,
  "needs_source"
);

const missingOfficialVerification = buildDocumentTemplateReadiness({
  ...baseTemplate,
  latestVerifiedAt: null
});
assert.equal(
  missingOfficialVerification.missingRequiredChecks.some((check) => check.id === "official_source_verified"),
  true
);

assert.equal(
  buildDocumentTemplateReadiness({
    ...baseTemplate,
    requiredFields: []
  }).status,
  "needs_mapping"
);

assert.equal(
  buildDocumentTemplateReadiness({
    ...baseTemplate,
    conversionStatus: "conversion_testing"
  }).status,
  "needs_conversion_test"
);

assert.equal(buildDocumentTemplateReadiness(baseTemplate).status, "ready_candidate");

assert.equal(
  buildDocumentTemplateReadiness({
    ...baseTemplate,
    conversionStatus: "manual_only"
  }).status,
  "manual_only"
);

const highRiskReadiness = buildDocumentTemplateReadiness({
  ...baseTemplate,
  riskLevel: "high",
  conversionStatus: "template_candidate"
});
assert.equal(highRiskReadiness.status, "needs_review");
assert.equal(highRiskReadiness.warnings.includes("업무범위/공식서식 검토 필요"), true);

const summary = buildDocumentTemplateReadinessSummary([
  baseTemplate,
  { ...baseTemplate, id: "needs_source", sourceAssetStatus: "source_needed" },
  { ...baseTemplate, id: "manual", conversionStatus: "manual_only" }
]);
assert.deepEqual(summary, {
  totalTemplates: 3,
  readyCandidateCount: 1,
  sourceNeededCount: 1,
  conversionTestNeededCount: 0,
  manualOnlyCount: 1
});

const source = readFileSync(
  join(process.cwd(), "src/lib/document-templates/document-template-readiness.ts"),
  "utf8"
);
for (const forbidden of ["readFile", "writeFile", "existsSync", "google", "drive", "fetch("]) {
  assert.equal(source.includes(forbidden), false, `Forbidden access found: ${forbidden}`);
}

console.log("document template readiness tests passed");
