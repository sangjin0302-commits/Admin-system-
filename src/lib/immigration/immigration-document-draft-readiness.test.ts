import { strict as assert } from "node:assert";

import {
  buildImmigrationDocumentDraftAvailableInputFieldIds,
  buildImmigrationDocumentDraftReadinessForCase,
  buildImmigrationDocumentDraftReadinessListForCase,
  type ImmigrationDocumentDraftCaseData
} from "@/lib/immigration/immigration-document-draft-readiness";

const safeCaseData: ImmigrationDocumentDraftCaseData = {
  caseMatter: {
    caseNo: "20260517-VISAISSU-003",
    title: "QA NON_CUSTOMER draft readiness case",
    summary: "QA-only summary.",
    dueDate: new Date("2026-05-22T00:00:00.000Z")
  },
  immigrationDetail: {
    dispositionType: "VISA_ISSUANCE_SUPPORT",
    serviceDate: "2026-05-17",
    appealDeadline: "2026-05-22",
    submissionDeadline: "2026-05-25",
    nationality: "QA",
    currentStayStatus: "QA status",
    familyInKoreaSummary: "QA-only family summary.",
    residenceBaseSummary: "QA-only residence summary.",
    employmentOrSchoolSummary: "QA-only employment summary.",
    violationHistorySummary: "QA-only none summary.",
    scopeReviewRequired: false,
    attorneyScopeRisk: false,
    officialFormCheckRequired: false
  },
  requiredDocuments: [{ id: "doc_1" }],
  caseParties: [{ role: "CLIENT", name: "QA NON_CUSTOMER" }],
  caseEvents: [{ eventType: "IMMIGRATION_CASE_DETAIL_UPDATED", message: "deadline verified" }]
};

const available = buildImmigrationDocumentDraftAvailableInputFieldIds(safeCaseData);
assert.ok(available.includes("caseMatter.caseNo"));
assert.ok(available.includes("caseMatter.title"));
assert.ok(available.includes("caseMatter.summary"));
assert.ok(available.includes("caseMatter.dueDate"));
assert.ok(available.includes("immigrationDetail.dispositionType"));
assert.ok(available.includes("immigrationDetail.serviceDate"));
assert.ok(available.includes("immigrationDetail.appealDeadline"));
assert.ok(available.includes("immigrationDetail.submissionDeadline"));
assert.ok(available.includes("immigrationDetail.nationality"));
assert.ok(available.includes("immigrationDetail.currentStayStatus"));
assert.ok(available.includes("immigrationDetail.familyInKoreaSummary"));
assert.ok(available.includes("immigrationDetail.residenceBaseSummary"));
assert.ok(available.includes("immigrationDetail.employmentOrSchoolSummary"));
assert.ok(available.includes("immigrationDetail.violationHistorySummary"));
assert.ok(available.includes("immigrationDetail.scopeReviewRequired"));
assert.ok(available.includes("immigrationDetail.attorneyScopeRisk"));
assert.ok(available.includes("immigrationDetail.officialFormCheckRequired"));
assert.ok(available.includes("requiredDocuments.evidenceList"));
assert.ok(available.includes("caseParties.clientName"));
assert.ok(available.includes("caseEvents.latestDeadlineVerification"));

const serializedAvailable = JSON.stringify(available);
assert.equal(serializedAvailable.includes("passportNumber"), false);
assert.equal(serializedAvailable.includes("alienRegistrationNumber"), false);
assert.equal(serializedAvailable.includes("fullAddress"), false);
assert.equal(serializedAvailable.includes("internalMemo"), false);
assert.equal(serializedAvailable.includes("communicationLogs"), false);

const missingFactSummary = buildImmigrationDocumentDraftReadinessForCase("fact_summary", {
  caseMatter: { caseNo: "QA-1" },
  immigrationDetail: null,
  requiredDocuments: [],
  caseParties: []
});
assert.equal(missingFactSummary.status, "missing_required_inputs");
assert.ok(missingFactSummary.missingRequiredFields.some((field) => field.id === "caseMatter.title"));
assert.ok(
  missingFactSummary.missingRequiredFields.some(
    (field) => field.id === "immigrationDetail.dispositionType"
  )
);

const appealReady = buildImmigrationDocumentDraftReadinessForCase(
  "administrative_appeal_petition_draft",
  safeCaseData
);
assert.equal(appealReady.status, "ready");
assert.equal(appealReady.canExport, false);

const blockedByScope = buildImmigrationDocumentDraftReadinessForCase("administrative_appeal_petition_draft", {
  ...safeCaseData,
  immigrationDetail: {
    ...safeCaseData.immigrationDetail,
    scopeReviewRequired: true,
    officialFormCheckRequired: false
  }
});
assert.equal(blockedByScope.status, "blocked_by_scope_review");

const blockedByOfficialForm = buildImmigrationDocumentDraftReadinessForCase(
  "administrative_appeal_petition_draft",
  {
    ...safeCaseData,
    immigrationDetail: {
      ...safeCaseData.immigrationDetail,
      scopeReviewRequired: false,
      officialFormCheckRequired: true
    }
  }
);
assert.equal(blockedByOfficialForm.status, "blocked_by_official_form_check");

const scopeRiskWarning = buildImmigrationDocumentDraftReadinessForCase("fact_summary", {
  ...safeCaseData,
  immigrationDetail: {
    ...safeCaseData.immigrationDetail,
    attorneyScopeRisk: true
  }
});
assert.ok(scopeRiskWarning.warnings.some((warning) => warning.includes("변호사 업무범위 위험")));

const list = buildImmigrationDocumentDraftReadinessListForCase("visa_issuance_support", safeCaseData);
assert.ok(list.some((item) => item.templateId === "fact_summary"));
assert.ok(list.every((item) => item.canExport === false));

console.log("immigration document draft readiness tests passed");
