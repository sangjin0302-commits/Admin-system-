import assert from "node:assert/strict";

import { buildImmigrationCaseHintPanelModel } from "@/components/admin/immigration-case-hint-panel";

const deportationModel = buildImmigrationCaseHintPanelModel("deportation_order_appeal");
assert.ok(deportationModel, "immigration matterType should build panel model");
assert.equal(deportationModel.definition.matterType, "deportation_order_appeal");
assert.equal(deportationModel.categoryLabel, "행정심판/불복");
assert.ok(deportationModel.deadlines.some((deadline) => deadline.field === "appealDeadline"));
assert.ok(deportationModel.deadlines.some((deadline) => deadline.field === "serviceDate"));
assert.ok(
  deportationModel.deadlines.some(
    (deadline) => deadline.field === "appealDeadline" && deadline.recommendedCaseMatterDueDateCandidate
  ),
  "appeal deadline should be marked as dueDate candidate"
);
assert.ok(
  deportationModel.deadlines.every((deadline) => deadline.requiresManualVerification && deadline.sourceHintKo),
  "deadline hints should expose source hints and manual verification"
);
assert.ok(
  deportationModel.requiredDocuments.some((document) => document.id === "deportation_order_notice"),
  "deportation appeal should include written order notice"
);
assert.ok(
  deportationModel.requiredDocuments.some((document) => document.id === "stay_of_execution_review_material"),
  "deportation appeal should include stay of execution review material"
);
assert.ok(
  deportationModel.safetyGuardrails.some((guardrail) => guardrail.id === "no_ai_legal_conclusion"),
  "panel should include AI legal conclusion guardrail"
);
assert.ok(
  deportationModel.safetyGuardrails.some((guardrail) => guardrail.id === "check_administrative_scrivener_scope"),
  "panel should include administrative scrivener scope guardrail"
);
assert.ok(
  deportationModel.safetyGuardrails.some((guardrail) => guardrail.id === "check_attorney_scope_risk"),
  "panel should include attorney scope risk guardrail"
);
assert.ok(
  deportationModel.safetyGuardrails.some((guardrail) => guardrail.id === "verify_original_disposition_document"),
  "panel should require original disposition document verification"
);

const highRiskDrafts = deportationModel.draftCandidates.filter((candidate) => candidate.riskLevel === "high");
assert.ok(highRiskDrafts.length > 0, "deportation appeal should expose high-risk draft candidates");
for (const candidate of highRiskDrafts) {
  assert.equal(candidate.requiresScopeReview, true);
  assert.equal(candidate.requiresOfficialFormCheck, true);
  assert.equal(candidate.adminOnlyPreview, true);
}

const sensitiveDocument = deportationModel.requiredDocuments.find((document) => document.sensitive);
assert.ok(sensitiveDocument, "panel should include sensitive document hints");
assert.ok(sensitiveDocument.securityNoteKo, "sensitive document should include security note");

const departureModel = buildImmigrationCaseHintPanelModel("departure_order_appeal");
assert.ok(departureModel);
assert.ok(
  departureModel.deadlines.some((deadline) => deadline.field === "departureDeadline"),
  "departure order appeal should include departure deadline field"
);
assert.ok(
  departureModel.requiredDocuments.some((document) => document.id === "departure_deadline_evidence"),
  "departure order appeal should include departure deadline evidence"
);

const extensionModel = buildImmigrationCaseHintPanelModel("stay_extension_denial_appeal");
assert.ok(extensionModel);
assert.ok(
  extensionModel.deadlines.some((deadline) => deadline.field === "stayExpiryDate"),
  "stay extension denial appeal should include stay expiry deadline field"
);
assert.ok(
  extensionModel.requiredDocuments.some((document) => document.id === "stay_expiry_evidence"),
  "stay extension denial appeal should include stay expiry evidence"
);

const statusChangeModel = buildImmigrationCaseHintPanelModel("status_change_denial_appeal");
assert.ok(statusChangeModel);
assert.ok(
  statusChangeModel.requiredDocuments.some((document) => document.id === "eligibility_evidence"),
  "status change denial appeal should include eligibility evidence"
);

assert.equal(buildImmigrationCaseHintPanelModel("general_case_matter"), null);

const serialized = JSON.stringify({
  notices: [
    deportationModel.safetyNotice,
    deportationModel.deadlineInputNotice,
    deportationModel.checklistNotice,
    deportationModel.draftNotice
  ],
  model: deportationModel
});
assert.doesNotMatch(serialized, /결과 보장|100% 허가|즉시 해결|AI가 판단/);
assert.doesNotMatch(serialized, /guaranteed result|guarantee approval|instant resolution/i);
assert.match(serialized, /입력 준비용 힌트/);
assert.match(serialized, /아직 기한 값을 저장하지 않습니다/);
assert.match(serialized, /sourceHintKo/);
assert.doesNotMatch(serialized, /저장 버튼|auto-save|autosave|POST|PATCH|DELETE/i);

console.log("immigration case hint panel tests passed");
