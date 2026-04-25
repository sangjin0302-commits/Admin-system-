import assert from "node:assert/strict";

import { handleRunLawbotWorkflowRequest } from "./lawbot-bridge-case-workflow-action";
import {
  LawbotBridgeHttpClient,
  LawbotBridgeTransportError
} from "./lawbot-bridge-http-client";
import type {
  LawbotBridgeCaseWorkflowResult,
  BridgeWorkflowPersistencePort,
  LawbotBridgeWorkflowClient,
  WorkflowCaseRecord,
  WorkflowInquiryRecord
} from "./lawbot-bridge-case-workflow-service";

type MemoryState = {
  inquiry: WorkflowInquiryRecord | null;
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
      if (!state.inquiry || state.inquiry.id !== inquiryId) {
        return null;
      }
      return { ...state.inquiry };
    },
    async getCaseByInquiryId(inquiryId) {
      if (!state.caseRecord || state.caseRecord.inquiryId !== inquiryId) {
        return null;
      }
      return { ...state.caseRecord };
    },
    async updateInquiryWorkflow(inquiryId, update) {
      assert.equal(state.inquiry?.id, inquiryId);
      state.inquiry = {
        ...state.inquiry!,
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
      state.caseRecord = {
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
      return { ...state.caseRecord };
    },
    async updateCaseWorkflow(caseId, update) {
      assert.equal(state.caseRecord?.id, caseId);
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
        matched_subtype_keys: ["licensing_refusal"],
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
        matched_subtype_keys: ["admin_appeal_refusal"],
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

function createBaseInquiryState(): MemoryState {
  return {
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
}

async function testSuccessfulFlow() {
  const callOrder: string[] = [];
  const state = createBaseInquiryState();

  const response = await handleRunLawbotWorkflowRequest(
    new Request("http://localhost/api/admin/inquiries/inq_1/run-lawbot-workflow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        documentDraftKind: "admin_appeal_brief",
        customerMessageKind: "document_followup",
        customerMessageTone: "professional"
      })
    }),
    "inq_1",
    {
      client: createMockClient(callOrder),
      persistence: createMemoryPersistence(state)
    }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { result: LawbotBridgeCaseWorkflowResult };
  assert.deepEqual(callOrder, [
    "intake_analyze",
    "intake_profile",
    "document_draft",
    "customer_message_draft"
  ]);
  assert.equal(json.result.caseId, "case_1");
  assert.equal(json.result.approvalPending, true);
  assert.equal(json.result.reviewSignals.reviewRequired, true);
  assert.deepEqual(json.result.reviewSignals.mustVerify, ["confirm service date"]);
  assert.deepEqual(json.result.reviewSignals.mustVerifySources, ["disposition notice"]);
  assert.deepEqual(json.result.reviewSignals.riskFlags, ["timing_risk"]);
  assert.deepEqual(json.result.reviewSignals.matchedSubtypeKeys, ["admin_appeal_refusal"]);
  assert.equal(json.result.reviewSignals.legalAxisClues.length > 0, true);
  assert.equal(json.result.reviewSignals.reviewerAttentionPanel.reviewRequired, true);
  assert.equal(json.result.reviewSignals.reviewerPatternReviewPanel.items.length > 0, true);
  assert.equal(json.result.reviewSignals.operatorAssistPanel.items.length > 0, true);
  assert.equal(json.result.reviewSignals.sourceVerificationChecklist.totalRequired > 0, true);
  assert.equal(json.result.reviewSignals.approvalWorkflowGate.requiresManualReview, true);
  assert.equal(state.caseRecord?.bridgeWorkflowStatus, "APPROVAL_PENDING");
  assert.equal(state.documentDrafts.length, 1);
  assert.equal(state.messageDrafts.length, 1);
  assert.equal(state.sourceVerificationTasks.length, 3);
  assert.equal(state.documentRequestTasks.length, 2);
  assert.equal(state.caseTasks.length, 13);
}

async function testSuccessfulFlowWithMockedHttpLayer() {
  const callOrder: string[] = [];
  const state = createBaseInquiryState();

  const client = new LawbotBridgeHttpClient(
    {
      baseUrl: "https://lawbot.example.com",
      serviceKey: "secret-key",
      serviceCaller: "admin-backend",
      timeoutMs: 500,
      maxRetries: 0
    },
    async (input) => {
      const url = String(input);
      callOrder.push(url);

      if (url.endsWith("/bridge/intake/analyze")) {
        return new Response(
          JSON.stringify({
            review_required: true,
            must_verify: ["confirm client identity"],
            risk_flags: ["timing_risk"],
            practitioner_guide: { what_to_check_first: ["requested outcome"] },
            case_outlook: {
              key_decision_factors: ["service date"],
              missing_case_facts: ["disposition notice"]
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.endsWith("/bridge/intake/profile")) {
        return new Response(
          JSON.stringify({
            review_required: true,
            must_verify: ["confirm filing timeline"],
            must_verify_sources: ["disposition notice"],
            risk_flags: ["service_gap"],
            matched_subtype_keys: ["licensing_refusal"],
            practitioner_guide: { common_mistake: ["overstating service facts"] },
            case_outlook: {
              key_decision_factors: ["proof of receipt"],
              missing_case_facts: ["service route"]
            },
            domain_pack: {
              required_documents: ["disposition notice", "proof of service"],
              review_checkpoints: ["check filing deadline"]
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.endsWith("/bridge/drafts/document")) {
        return new Response(
          JSON.stringify({
            draft_type: "admin_appeal_brief",
            draft: {
              document_type: "admin_appeal_brief",
              sections: { claim_purposes: ["revoke disposition"] }
            },
            review_required: true,
            must_verify: ["confirm service date"],
            must_verify_sources: ["disposition notice"],
            risk_flags: ["timing_risk"]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.endsWith("/bridge/drafts/customer-message")) {
        return new Response(
          JSON.stringify({
            message_kind: "document_followup",
            draft: {
              subject: "Additional documents needed",
              body: ["Please send the disposition notice.", "We will review after receipt."]
            },
            review_required: true,
            must_verify: ["confirm service date"],
            must_verify_sources: ["disposition notice"],
            risk_flags: ["timing_risk"],
            matched_subtype_keys: ["admin_appeal_refusal"]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("not found", { status: 404 });
    }
  );

  const response = await handleRunLawbotWorkflowRequest(
    new Request("http://localhost/api/admin/inquiries/inq_1/run-lawbot-workflow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        documentDraftKind: "admin_appeal_brief",
        customerMessageKind: "document_followup",
        customerMessageTone: "professional"
      })
    }),
    "inq_1",
    {
      client,
      persistence: createMemoryPersistence(state)
    }
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { result: LawbotBridgeCaseWorkflowResult };
  assert.equal(payload.result.reviewSignals.reviewRequired, true);
  assert.deepEqual(payload.result.reviewSignals.mustVerifySources, ["disposition notice"]);
  assert.deepEqual(payload.result.reviewSignals.matchedSubtypeKeys, ["admin_appeal_refusal"]);
  assert.equal(payload.result.reviewSignals.reviewerAttentionPanel.items.length > 0, true);
  assert.equal(payload.result.reviewSignals.reviewerPatternReviewPanel.items.length > 0, true);
  assert.equal(payload.result.reviewSignals.sourceVerificationChecklist.totalRequired > 0, true);
  assert.equal(payload.result.reviewSignals.approvalWorkflowGate.requiresManualReview, true);
  assert.deepEqual(callOrder, [
    "https://lawbot.example.com/bridge/intake/analyze",
    "https://lawbot.example.com/bridge/intake/profile",
    "https://lawbot.example.com/bridge/drafts/document",
    "https://lawbot.example.com/bridge/drafts/customer-message"
  ]);
}

async function testInquiryNotFound() {
  const response = await handleRunLawbotWorkflowRequest(
    new Request("http://localhost/api/admin/inquiries/missing/run-lawbot-workflow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    }),
    "missing",
    {
      client: createMockClient([]),
      persistence: createMemoryPersistence({
        inquiry: null,
        caseRecord: null,
        caseTasks: [],
        sourceVerificationTasks: [],
        documentRequestTasks: [],
        documentDrafts: [],
        messageDrafts: []
      })
    }
  );

  assert.equal(response.status, 404);
}

async function testTransportErrorMapping() {
  const state = createBaseInquiryState();

  const response = await handleRunLawbotWorkflowRequest(
    new Request("http://localhost/api/admin/inquiries/inq_1/run-lawbot-workflow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    }),
    "inq_1",
    {
      client: {
        async intakeAnalyze() {
          throw new LawbotBridgeTransportError("timeout");
        },
        async intakeProfile() {
          throw new Error("not expected");
        },
        async createDocumentDraft() {
          throw new Error("not expected");
        },
        async createCustomerMessageDraft() {
          throw new Error("not expected");
        }
      },
      persistence: createMemoryPersistence(state)
    }
  );

  assert.equal(response.status, 504);
  const payload = await response.json();
  assert.equal(payload.reason, "lawbot_bridge_transport_error");
}

async function run() {
  await testSuccessfulFlow();
  await testSuccessfulFlowWithMockedHttpLayer();
  await testInquiryNotFound();
  await testTransportErrorMapping();
  console.log("lawbot-bridge-case-workflow-action-test-ok");
}

run();
