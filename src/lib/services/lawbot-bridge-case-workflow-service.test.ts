import assert from "node:assert/strict";

import {
  runLawbotBridgeCaseWorkflow,
  type BridgeWorkflowPersistencePort,
  type LawbotBridgeWorkflowClient,
  type WorkflowCaseRecord,
  type WorkflowInquiryRecord
} from "./lawbot-bridge-case-workflow-service.ts";

type MemoryState = {
  inquiry: WorkflowInquiryRecord;
  caseRecord: WorkflowCaseRecord | null;
  caseTasks: Array<Record<string, unknown>>;
  sourceVerificationTasks: Array<Record<string, unknown>>;
  documentRequestTasks: Array<Record<string, unknown>>;
  documentDrafts: Array<Record<string, unknown>>;
  messageDrafts: Array<Record<string, unknown>>;
};

function createMemoryPersistence(state: MemoryState): BridgeWorkflowPersistencePort {
  let caseSequence = 1;
  let documentDraftSequence = 1;
  let messageDraftSequence = 1;

  return {
    async getInquiryById(inquiryId) {
      return state.inquiry.id === inquiryId ? { ...state.inquiry } : null;
    },
    async getCaseByInquiryId(inquiryId) {
      if (!state.caseRecord || state.caseRecord.inquiryId !== inquiryId) {
        return null;
      }
      return { ...state.caseRecord };
    },
    async updateInquiryWorkflow(inquiryId, update) {
      assert.equal(inquiryId, state.inquiry.id);
      state.inquiry = {
        ...state.inquiry,
        bridgeWorkflowStatus: update.bridgeWorkflowStatus,
        bridgeReviewRequired: update.bridgeReviewRequired,
        bridgeMustVerify: update.bridgeMustVerify,
        bridgeMustVerifySources: update.bridgeMustVerifySources,
        bridgeRiskFlags: update.bridgeRiskFlags,
        bridgePractitionerGuide: update.bridgePractitionerGuide,
        bridgeCaseOutlook: update.bridgeCaseOutlook
      };
    },
    async createCaseForInquiry({ inquiry, workflow }) {
      const caseRecord: WorkflowCaseRecord = {
        id: `case_${caseSequence}`,
        inquiryId: inquiry.id,
        caseNumber: `CASE-TEST-${String(caseSequence).padStart(3, "0")}`,
        bridgeWorkflowStatus: workflow.bridgeWorkflowStatus,
        bridgeReviewRequired: workflow.bridgeReviewRequired,
        bridgeMustVerify: workflow.bridgeMustVerify,
        bridgeMustVerifySources: workflow.bridgeMustVerifySources,
        bridgeRiskFlags: workflow.bridgeRiskFlags,
        bridgePractitionerGuide: workflow.bridgePractitionerGuide,
        bridgeCaseOutlook: workflow.bridgeCaseOutlook
      };
      caseSequence += 1;
      state.caseRecord = caseRecord;
      return { ...caseRecord };
    },
    async updateCaseWorkflow(caseId, update) {
      assert.ok(state.caseRecord);
      assert.equal(caseId, state.caseRecord?.id);
      state.caseRecord = {
        ...state.caseRecord!,
        bridgeWorkflowStatus: update.bridgeWorkflowStatus,
        bridgeReviewRequired: update.bridgeReviewRequired,
        bridgeMustVerify: update.bridgeMustVerify,
        bridgeMustVerifySources: update.bridgeMustVerifySources,
        bridgeRiskFlags: update.bridgeRiskFlags,
        bridgePractitionerGuide: update.bridgePractitionerGuide,
        bridgeCaseOutlook: update.bridgeCaseOutlook
      };
    },
    async createCaseTasks(tasks) {
      state.caseTasks.push(...tasks);
    },
    async createSourceVerificationTasks(tasks) {
      state.sourceVerificationTasks.push(...tasks);
    },
    async createDocumentRequestTasks(tasks) {
      state.documentRequestTasks.push(...tasks);
    },
    async createDocumentDraft(draft) {
      const record = {
        id: `doc_${documentDraftSequence}`,
        ...draft
      };
      documentDraftSequence += 1;
      state.documentDrafts.push(record);
      return { id: record.id };
    },
    async createMessageDraft(draft) {
      const record = {
        id: `msg_${messageDraftSequence}`,
        ...draft
      };
      messageDraftSequence += 1;
      state.messageDrafts.push(record);
      return { id: record.id };
    }
  };
}

function createMockClient(callOrder: string[]): LawbotBridgeWorkflowClient {
  return {
    async intakeAnalyze() {
      callOrder.push("intake_analyze");
      return {
        review_required: true,
        must_verify: ["confirm client identity"],
        risk_flags: ["timing_risk"],
        practitioner_guide: {
          what_to_check_first: ["requested outcome"]
        },
        case_outlook: {
          key_decision_factors: ["service date"],
          missing_case_facts: ["disposition notice"]
        }
      };
    },
    async intakeProfile() {
      callOrder.push("intake_profile");
      return {
        review_required: true,
        must_verify: ["confirm filing timeline"],
        must_verify_sources: ["disposition notice"],
        risk_flags: ["service_gap"],
        practitioner_guide: {
          common_mistake: ["overstating service facts"]
        },
        case_outlook: {
          key_decision_factors: ["proof of receipt"],
          missing_case_facts: ["service route"]
        },
        domain_pack: {
          required_documents: ["disposition notice", "proof of service"],
          review_checkpoints: ["check filing deadline"]
        }
      };
    },
    async createDocumentDraft() {
      callOrder.push("document_draft");
      return {
        draft_type: "admin_appeal_brief",
        draft: {
          document_type: "admin_appeal_brief",
          sections: {
            claim_purposes: ["revoke disposition"]
          }
        },
        review_required: true,
        must_verify: ["confirm service date"],
        must_verify_sources: ["disposition notice"],
        risk_flags: ["timing_risk"],
        practitioner_guide: {
          what_not_to_state_confidently: ["final success likelihood"]
        },
        case_outlook: {
          key_decision_factors: ["timeliness"],
          missing_case_facts: ["evidence of delivery"]
        }
      };
    },
    async createCustomerMessageDraft() {
      callOrder.push("customer_message_draft");
      return {
        message_kind: "document_followup",
        draft: {
          subject: "Additional documents needed",
          body: ["Please send the disposition notice.", "We will review after receipt."]
        },
        review_required: true,
        must_verify: ["confirm service date"],
        must_verify_sources: ["disposition notice"],
        risk_flags: ["timing_risk"],
        practitioner_guide: {
          why_it_matters: ["customer message must stay non-final"]
        },
        case_outlook: {
          key_decision_factors: ["proof of service"],
          missing_case_facts: ["date of receipt"]
        }
      };
    }
  };
}

async function run() {
  const state: MemoryState = {
    inquiry: {
      id: "inq_1",
      contactName: "Kim Admin",
      title: "Administrative appeal intake",
      description: "Client received a refusal disposition and wants to challenge it.",
      email: "kim@example.com",
      nationality: "KR",
      currentStatus: "refusal_disposition",
      requestedOutcome: "cancel refusal",
      targetAgency: "Seoul Office",
      generatedSummary: "Initial intake summary",
      classificationReason: "Administrative appeal path likely",
      recommendedNextStep: "collect disposition notice"
    },
    caseRecord: null,
    caseTasks: [],
    sourceVerificationTasks: [],
    documentRequestTasks: [],
    documentDrafts: [],
    messageDrafts: []
  };
  const callOrder: string[] = [];

  const result = await runLawbotBridgeCaseWorkflow(
    {
      client: createMockClient(callOrder),
      persistence: createMemoryPersistence(state)
    },
    {
      inquiryId: "inq_1",
      documentDraftKind: "admin_appeal_brief",
      customerMessageKind: "document_followup"
    }
  );

  assert.deepEqual(callOrder, [
    "intake_analyze",
    "intake_profile",
    "document_draft",
    "customer_message_draft"
  ]);
  assert.equal(result.caseId, "case_1");
  assert.equal(result.caseNumber, "CASE-TEST-001");
  assert.equal(result.approvalPending, true);
  assert.equal(result.inquiryWorkflowStatus, "APPROVAL_PENDING");
  assert.equal(result.caseWorkflowStatus, "APPROVAL_PENDING");
  assert.equal(state.caseRecord?.bridgeWorkflowStatus, "APPROVAL_PENDING");
  assert.equal(state.documentDrafts.length, 1);
  assert.equal(state.messageDrafts.length, 1);
  assert.equal(state.documentDrafts[0]?.status, "APPROVAL_PENDING");
  assert.equal(state.messageDrafts[0]?.status, "APPROVAL_PENDING");
  assert.equal(state.sourceVerificationTasks.length, 3);
  assert.equal(state.documentRequestTasks.length, 2);
  assert.equal(state.caseTasks.length, 13);
  assert.equal(result.createdCounts.caseTasks, 13);
  assert.equal(result.createdCounts.sourceVerificationTasks, 3);
  assert.equal(result.createdCounts.documentRequestTasks, 2);
  assert.equal(state.documentDrafts[0]?.caseId, "case_1");
  assert.equal(state.messageDrafts[0]?.caseId, "case_1");
  assert.equal(state.sourceVerificationTasks[1]?.documentDraftId, "doc_1");
  assert.equal(state.sourceVerificationTasks[2]?.messageDraftId, "msg_1");

  console.log("lawbot-bridge-case-workflow-test-ok");
}

run();
