import assert from "node:assert/strict";

import {
  getDeadlinePriorityForMatterType,
  getDraftCandidatesForMatterType,
  formatCaseMatterTypeLabel,
  getImmigrationMatterTypeDefinition,
  getImmigrationMatterTypeLabel,
  getRequiredDocumentTemplatesForMatterType,
  getSafetyGuardrailsForMatterType,
  immigrationDispositionTypeDefinitions,
  immigrationDraftTemplateCandidates,
  immigrationDueDatePriority,
  immigrationMatterTypeDefinitions,
  immigrationRequiredDocumentTemplates,
  immigrationSafetyGuardrails,
  isImmigrationMatterType,
  listImmigrationMatterTypeOptions,
  listImmigrationMatterTypes,
  listImmigrationMatterTypesByCategory
} from "@/lib/immigration/immigration-appeal-registry";

function assertUnique(values: readonly string[], label: string) {
  assert.equal(new Set(values).size, values.length, `${label} should be unique`);
}

assertUnique(
  immigrationMatterTypeDefinitions.map((definition) => definition.matterType),
  "matterTypes"
);
assertUnique(
  immigrationDispositionTypeDefinitions.map((definition) => definition.code),
  "disposition codes"
);
assertUnique(
  immigrationRequiredDocumentTemplates.map((template) => template.id),
  "document template ids"
);
assertUnique(
  immigrationDraftTemplateCandidates.map((candidate) => candidate.id),
  "draft candidate ids"
);
assertUnique(
  immigrationSafetyGuardrails.map((guardrail) => guardrail.id),
  "guardrail ids"
);

for (const definition of immigrationMatterTypeDefinitions) {
  assert.ok(definition.labelKo, `${definition.matterType} should have Korean label`);
  assert.ok(definition.safetyGuardrailIds.length > 0, `${definition.matterType} should have guardrails`);
  assert.ok(
    getSafetyGuardrailsForMatterType(definition.matterType).length > 0,
    `${definition.matterType} should resolve guardrails`
  );
}

assert.equal(listImmigrationMatterTypes().length, 13);
assert.ok(listImmigrationMatterTypesByCategory("immigration_appeal").length >= 6);
const matterTypeOptions = listImmigrationMatterTypeOptions();
assert.equal(matterTypeOptions.length, 13);
assertUnique(
  matterTypeOptions.map((option) => option.value),
  "matter type option values"
);
for (const option of matterTypeOptions) {
  assert.ok(option.label, `${option.value} should have option label`);
  assert.ok(option.description, `${option.value} should have option description`);
}
assert.ok(matterTypeOptions.some((option) => option.category === "immigration_appeal"));
assert.equal(isImmigrationMatterType("deportation_order_appeal"), true);
assert.equal(isImmigrationMatterType("unknown_type"), false);
assert.equal(getImmigrationMatterTypeDefinition("unknown_type"), null);
assert.equal(
  getImmigrationMatterTypeLabel("deportation_order_appeal"),
  getImmigrationMatterTypeDefinition("deportation_order_appeal")?.labelKo
);
assert.equal(getImmigrationMatterTypeLabel("unknown_type"), null);
assert.equal(
  formatCaseMatterTypeLabel("deportation_order_appeal"),
  getImmigrationMatterTypeDefinition("deportation_order_appeal")?.labelKo
);
assert.equal(formatCaseMatterTypeLabel("case_card_qa"), "case_card_qa");
assert.equal(formatCaseMatterTypeLabel(""), "-");
assert.deepEqual(getDeadlinePriorityForMatterType("unknown_type"), []);
assert.deepEqual(getRequiredDocumentTemplatesForMatterType("unknown_type"), []);
assert.deepEqual(getDraftCandidatesForMatterType("unknown_type"), []);
assert.deepEqual(getSafetyGuardrailsForMatterType("unknown_type"), []);

assert.deepEqual(immigrationDueDatePriority, [
  "appealDeadline",
  "departureDeadline",
  "supplementDeadline",
  "stayExpiryDate",
  "submissionDeadline"
]);

const deportationDocs = getRequiredDocumentTemplatesForMatterType("deportation_order_appeal").map(
  (template) => template.id
);
assert.ok(deportationDocs.includes("administrative_appeal_draft_material"));
assert.ok(deportationDocs.includes("stay_of_execution_review_material"));
assert.ok(deportationDocs.includes("deportation_order_notice"));

const departureDocs = getRequiredDocumentTemplatesForMatterType("departure_order_appeal").map(
  (template) => template.id
);
assert.ok(departureDocs.includes("departure_deadline_evidence"));
assert.ok(departureDocs.includes("departure_order_notice"));

const extensionDocs = getRequiredDocumentTemplatesForMatterType("stay_extension_denial_appeal").map(
  (template) => template.id
);
assert.ok(extensionDocs.includes("stay_expiry_evidence"));
assert.ok(extensionDocs.includes("extension_reason_evidence"));

const statusChangeDocs = getRequiredDocumentTemplatesForMatterType("status_change_denial_appeal").map(
  (template) => template.id
);
assert.ok(statusChangeDocs.includes("eligibility_evidence"));
assert.ok(statusChangeDocs.includes("status_change_denial_notice"));

const highRiskDrafts = immigrationDraftTemplateCandidates.filter((candidate) => candidate.riskLevel === "high");
assert.ok(highRiskDrafts.length >= 2);
for (const candidate of highRiskDrafts) {
  assert.equal(candidate.adminOnlyPreview, true);
  assert.equal(candidate.requiresScopeReview, true);
  assert.equal(candidate.requiresOfficialFormCheck, true);
}

const serialized = JSON.stringify({
  matters: immigrationMatterTypeDefinitions,
  dispositions: immigrationDispositionTypeDefinitions,
  documents: immigrationRequiredDocumentTemplates,
  drafts: immigrationDraftTemplateCandidates,
  guardrails: immigrationSafetyGuardrails
});

assert.doesNotMatch(serialized, /guaranteed result|guarantee approval|승인 보장|결과 보장/);
assert.doesNotMatch(serialized, /automatic submission|자동 제출|무검토 발송/);
assert.doesNotMatch(serialized, /passportNumber.*required|alienRegistrationNumber.*required|여권번호.*필수|외국인등록번호.*필수/);

console.log("immigration appeal registry tests passed");
