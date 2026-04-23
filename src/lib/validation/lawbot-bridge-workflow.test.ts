import assert from "node:assert/strict";

import {
  canExternalOutputProceed,
  caseTaskCreateSchema,
  caseWorkflowRecordSchema,
  documentDraftCreateSchema,
  documentRequestTaskCreateSchema,
  inquiryWorkflowRecordSchema,
  messageDraftCreateSchema,
  shouldMoveDraftToApprovalPending,
  sourceVerificationTaskCreateSchema
} from "./lawbot-bridge-workflow.ts";

function run() {
  const inquiry = inquiryWorkflowRecordSchema.parse({
    inquiryId: "inq_123",
    status: "TRIAGE_REVIEW",
    reviewRequired: true,
    mustVerify: ["customer_identity"],
    mustVerifySources: [],
    riskFlags: ["timing_risk"]
  });
  assert.equal(inquiry.status, "TRIAGE_REVIEW");
  assert.equal(inquiry.reviewRequired, true);

  const caseRecord = caseWorkflowRecordSchema.parse({
    inquiryId: "inq_123",
    caseId: "case_123",
    status: "AWAITING_SOURCE_VERIFICATION",
    reviewRequired: true,
    mustVerify: ["filing_deadline"],
    mustVerifySources: ["disposition_notice"],
    riskFlags: ["service_gap"],
    caseOutlook: { missing_case_facts: ["service evidence"] }
  });
  assert.equal(caseRecord.caseId, "case_123");
  assert.deepEqual(caseRecord.mustVerifySources, ["disposition_notice"]);

  const caseTask = caseTaskCreateSchema.parse({
    inquiryId: "inq_123",
    caseId: "case_123",
    title: "Confirm service date",
    mustVerify: ["service_date"]
  });
  const sourceTask = sourceVerificationTaskCreateSchema.parse({
    inquiryId: "inq_123",
    caseId: "case_123",
    documentDraftId: "draft_123",
    title: "Verify disposition notice",
    sourceLabel: "Disposition Notice"
  });
  const documentTask = documentRequestTaskCreateSchema.parse({
    inquiryId: "inq_123",
    caseId: "case_123",
    title: "Collect filing documents",
    documentLabel: "Disposition notice copy"
  });
  assert.equal(caseTask.status, "OPEN");
  assert.equal(sourceTask.reviewRequired, true);
  assert.equal(documentTask.status, "OPEN");

  const documentDraft = documentDraftCreateSchema.parse({
    inquiryId: "inq_123",
    caseId: "case_123",
    draftType: "admin_appeal",
    reviewRequired: true,
    mustVerify: ["service_date"],
    mustVerifySources: ["disposition_notice"],
    riskFlags: ["timing_risk"]
  });
  const messageDraft = messageDraftCreateSchema.parse({
    inquiryId: "inq_123",
    caseId: "case_123",
    messageKind: "followup_request",
    subject: "Need more documents",
    bodyText: "Please send the notice.",
    reviewRequired: true
  });
  assert.equal(shouldMoveDraftToApprovalPending(documentDraft), true);
  assert.equal(shouldMoveDraftToApprovalPending(messageDraft), true);

  assert.equal(
    canExternalOutputProceed({
      status: "APPROVAL_PENDING",
      reviewRequired: true,
      mustVerify: [],
      mustVerifySources: []
    }),
    false
  );
  assert.equal(
    canExternalOutputProceed({
      status: "APPROVED",
      reviewRequired: false,
      mustVerify: ["service_date"],
      mustVerifySources: []
    }),
    false
  );
  assert.equal(
    canExternalOutputProceed({
      status: "APPROVED",
      reviewRequired: false,
      mustVerify: [],
      mustVerifySources: []
    }),
    true
  );

  console.log("lawbot-bridge-workflow-test-ok");
}

run();
