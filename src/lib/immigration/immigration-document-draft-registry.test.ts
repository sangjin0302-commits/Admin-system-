import { strict as assert } from "node:assert";

import {
  buildImmigrationDocumentDraftReadiness,
  getDocumentDraftTemplatesForMatterType,
  getHighRiskImmigrationDocumentDraftTemplates,
  getImmigrationDocumentDraftTemplate,
  getMissingInputFieldsForDraft,
  getRequiredInputFieldsForDraft,
  isImmigrationDocumentDraftTemplate,
  listImmigrationDocumentDraftTemplates
} from "@/lib/immigration/immigration-document-draft-registry";

const templates = listImmigrationDocumentDraftTemplates();

assert.equal(new Set(templates.map((template) => template.id)).size, templates.length);

for (const template of templates) {
  assert.equal(template.adminOnlyPreview, true, `${template.id} must be admin-only`);
  assert.equal(template.noAutomaticSubmission, true, `${template.id} must not allow automatic submission`);
}

for (const template of getHighRiskImmigrationDocumentDraftTemplates()) {
  assert.equal(template.requiresScopeReview, true, `${template.id} must require scope review`);
  assert.equal(template.requiresOfficialFormCheck, true, `${template.id} must require official form check`);
  assert.equal(template.adminOnlyPreview, true, `${template.id} must be admin-only preview`);
  assert.equal(template.noAutomaticSubmission, true, `${template.id} must block automatic submission`);
}

const appealPetition = getImmigrationDocumentDraftTemplate("administrative_appeal_petition_draft");
assert.ok(appealPetition);
assert.equal(appealPetition.riskLevel, "high");
assert.equal(appealPetition.requiresScopeReview, true);
assert.equal(appealPetition.requiresOfficialFormCheck, true);

const stayOfExecution = getImmigrationDocumentDraftTemplate("stay_of_execution_application_draft");
assert.ok(stayOfExecution);
assert.equal(stayOfExecution.riskLevel, "high");
assert.equal(stayOfExecution.requiresScopeReview, true);
assert.equal(stayOfExecution.requiresOfficialFormCheck, true);

const factSummary = getImmigrationDocumentDraftTemplate("fact_summary");
assert.ok(factSummary);
assert.deepEqual(factSummary.requiredInputFields, [
  "caseMatter.caseNo",
  "caseMatter.title",
  "immigrationDetail.dispositionType",
  "immigrationDetail.currentStayStatus"
]);

const forbiddenFieldFragments = [
  "passportNumber",
  "alienRegistrationNumber",
  "fullAddress",
  "raw file",
  "rawFile",
  "rawViolation",
  "internalMemo",
  "communicationLogs"
];

for (const template of templates) {
  const fieldIds = [...template.requiredInputFields, ...template.optionalInputFields];
  for (const fieldId of fieldIds) {
    for (const forbidden of forbiddenFieldFragments) {
      assert.equal(
        fieldId.includes(forbidden),
        false,
        `${template.id} must not require or optionally map sensitive field ${forbidden}`
      );
    }
  }
}

assert.ok(
  getDocumentDraftTemplatesForMatterType("deportation_order_appeal").some(
    (template) => template.id === "administrative_appeal_petition_draft"
  )
);
assert.ok(
  getDocumentDraftTemplatesForMatterType("departure_order_appeal").some(
    (template) => template.id === "stay_of_execution_application_draft"
  )
);
assert.ok(
  getDocumentDraftTemplatesForMatterType("stay_extension_denial_appeal").some(
    (template) => template.id === "stay_extension_or_change_reason_statement"
  )
);
assert.ok(
  getDocumentDraftTemplatesForMatterType("visa_issuance_support").some(
    (template) => template.id === "submitted_evidence_list"
  )
);
assert.deepEqual(getDocumentDraftTemplatesForMatterType("unknown_matter_type"), []);

const missingFields = getMissingInputFieldsForDraft("fact_summary", ["caseMatter.caseNo"]);
assert.ok(missingFields.some((field) => field.id === "caseMatter.title" && field.labelKo === "사건명"));
assert.ok(missingFields.every((field) => field.sourceGroup));

assert.deepEqual(getRequiredInputFieldsForDraft("unknown_template"), []);
assert.equal(isImmigrationDocumentDraftTemplate("fact_summary"), true);
assert.equal(isImmigrationDocumentDraftTemplate("unknown_template"), false);

const highRiskMissing = buildImmigrationDocumentDraftReadiness({
  templateId: "administrative_appeal_petition_draft",
  availableInputFieldIds: []
});
assert.equal(highRiskMissing.status, "missing_required_inputs");
assert.equal(highRiskMissing.canPreviewDraft, false);
assert.equal(highRiskMissing.canExport, false);

const appealRequiredFields = getRequiredInputFieldsForDraft("administrative_appeal_petition_draft").map(
  (field) => field.id
);

const highRiskBlockedByScope = buildImmigrationDocumentDraftReadiness({
  templateId: "administrative_appeal_petition_draft",
  availableInputFieldIds: appealRequiredFields,
  officialFormChecked: true,
  adminApproved: true
});
assert.equal(highRiskBlockedByScope.status, "blocked_by_scope_review");

const highRiskBlockedByForm = buildImmigrationDocumentDraftReadiness({
  templateId: "administrative_appeal_petition_draft",
  availableInputFieldIds: appealRequiredFields,
  scopeReviewed: true,
  adminApproved: true
});
assert.equal(highRiskBlockedByForm.status, "blocked_by_official_form_check");

const highRiskReady = buildImmigrationDocumentDraftReadiness({
  templateId: "administrative_appeal_petition_draft",
  availableInputFieldIds: appealRequiredFields,
  scopeReviewed: true,
  officialFormChecked: true,
  adminApproved: true
});
assert.equal(highRiskReady.status, "ready");
assert.equal(highRiskReady.canPreviewDraft, true);
assert.equal(highRiskReady.canExport, false);
assert.ok(highRiskReady.warnings.some((warning) => warning.includes("does not generate a document")));

const unknownReadiness = buildImmigrationDocumentDraftReadiness({
  templateId: "unknown_template",
  availableInputFieldIds: []
});
assert.equal(unknownReadiness.status, "unknown_template");
assert.equal(unknownReadiness.canPreviewDraft, false);

const registrySource = JSON.stringify(templates) + JSON.stringify(highRiskReady);
assert.equal(registrySource.includes("automatic submission"), false);
assert.equal(registrySource.includes("guarantee"), false);
assert.equal(registrySource.includes("100%"), false);

console.log("immigration document draft registry tests passed");
