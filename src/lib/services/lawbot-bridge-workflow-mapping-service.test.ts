import assert from "node:assert/strict";

import {
  mapCustomerMessageDraftResponseToWorkflow,
  mapDocumentDraftResponseToWorkflow,
  mapIntakeAnalyzeResponseToWorkflow,
  mapIntakeProfileResponseToWorkflow
} from "./lawbot-bridge-workflow-mapping-service.ts";

function run() {
  const analyze = mapIntakeAnalyzeResponseToWorkflow(
    { inquiryId: "inq_1" },
    {
      review_required: true,
      must_verify: ["confirm identity"],
      risk_flags: ["timing_risk"],
      practitioner_guide: { why_it_matters: ["deadline matters"] },
      case_outlook: {
        key_decision_factors: ["service date"],
        missing_case_facts: ["disposition notice"]
      }
    }
  );

  assert.equal(analyze.inquiryUpdate.bridgeWorkflowStatus, "TRIAGE_REVIEW");
  assert.equal(analyze.caseTasks.length, 3);
  assert.equal(analyze.sourceVerificationTasks.length, 0);
  assert.equal(analyze.approvalPending, false);

  const profile = mapIntakeProfileResponseToWorkflow(
    { inquiryId: "inq_1", caseId: "case_1" },
    {
      review_required: true,
      must_verify: ["confirm filing timeline"],
      must_verify_sources: ["disposition notice"],
      risk_flags: ["service_gap"],
      practitioner_guide: { common_mistake: ["overstating facts"] },
      case_outlook: {
        key_decision_factors: ["service route"],
        missing_case_facts: ["proof of receipt"]
      },
      domain_pack: {
        required_documents: ["disposition notice", "proof of service"],
        review_checkpoints: ["check filing deadline"]
      }
    }
  );

  assert.equal(profile.inquiryUpdate.bridgeWorkflowStatus, "AWAITING_SOURCE_VERIFICATION");
  assert.equal(profile.caseUpdate?.bridgeWorkflowStatus, "AWAITING_SOURCE_VERIFICATION");
  assert.equal(profile.caseCreateSuggested, false);
  assert.equal(profile.sourceVerificationTasks.length, 1);
  assert.equal(profile.documentRequestTasks.length, 2);
  assert.equal(profile.caseTasks.length, 4);

  const documentDraft = mapDocumentDraftResponseToWorkflow(
    { inquiryId: "inq_1", caseId: "case_1" },
    {
      draft_type: "admin_appeal",
      draft: {
        document_type: "admin_appeal",
        sections: { claim_purposes: ["revoke disposition"] }
      },
      review_required: true,
      must_verify: ["confirm service date"],
      must_verify_sources: ["disposition notice"],
      risk_flags: ["timing_risk"],
      practitioner_guide: { what_to_check_first: ["service date"] },
      case_outlook: { missing_case_facts: ["receipt evidence"] }
    }
  );

  assert.equal(documentDraft.approvalPending, true);
  assert.equal(documentDraft.inquiryUpdate.bridgeWorkflowStatus, "APPROVAL_PENDING");
  assert.equal(documentDraft.documentDraft?.status, "APPROVAL_PENDING");
  assert.equal(documentDraft.sourceVerificationTasks.length, 1);
  assert.equal(documentDraft.documentDraft?.practitionerGuide !== null, true);

  const messageDraft = mapCustomerMessageDraftResponseToWorkflow(
    { inquiryId: "inq_1", caseId: "case_1" },
    {
      message_kind: "followup_request",
      draft: {
        subject: "Need more documents",
        body: ["Please send the notice.", "We will review after receipt."]
      },
      review_required: true,
      must_verify: ["confirm service date"],
      must_verify_sources: ["disposition notice"],
      risk_flags: ["timing_risk"],
      practitioner_guide: { what_not_to_state_confidently: ["final outcome"] },
      case_outlook: { key_decision_factors: ["receipt route"] }
    }
  );

  assert.equal(messageDraft.approvalPending, true);
  assert.equal(messageDraft.messageDraft?.status, "APPROVAL_PENDING");
  assert.equal(messageDraft.messageDraft?.subject, "Need more documents");
  assert.equal(
    messageDraft.messageDraft?.bodyText,
    "Please send the notice.\nWe will review after receipt."
  );
  assert.equal(messageDraft.sourceVerificationTasks.length, 1);

  console.log("lawbot-bridge-workflow-mapping-test-ok");
}

run();
