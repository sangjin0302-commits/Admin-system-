import assert from "node:assert/strict";

import {
  runLawbotBridgeCaseWorkflow,
  type BridgeWorkflowPersistencePort,
  type LawbotBridgeWorkflowClient,
  type WorkflowCaseRecord,
  type WorkflowInquiryRecord
} from "./lawbot-bridge-case-workflow-service";

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
  assert.equal(result.reviewSignals.reviewRequired, true);
  assert.deepEqual(result.reviewSignals.mustVerify, ["confirm service date"]);
  assert.deepEqual(result.reviewSignals.mustVerifySources, ["disposition notice"]);
  assert.deepEqual(result.reviewSignals.riskFlags, ["timing_risk"]);
  assert.deepEqual(result.reviewSignals.matchedSubtypeKeys, ["admin_appeal_refusal"]);
  assert.equal(result.reviewSignals.legalAxisClues.length > 0, true);
  assert.equal(result.reviewSignals.reviewerAttentionPanel.reviewRequired, true);
  assert.equal(result.reviewSignals.reviewerAttentionPanel.items.length > 0, true);
  assert.equal(result.reviewSignals.reviewerPatternReviewPanel.items.length > 0, true);
  assert.equal(result.reviewSignals.operatorAssistPanel.items.length > 0, true);
  assert.equal(result.reviewSignals.sourceVerificationChecklist.totalRequired > 0, true);
  assert.equal(result.reviewSignals.approvalWorkflowGate.requiresManualReview, true);
  assert.equal(
    result.reviewSignals.approvalWorkflowGate.blockerCodes.includes("review_required"),
    true
  );
  const practitionerGuide = result.reviewSignals.practitionerGuide as Record<string, unknown> | null;
  const whyItMatters: string[] = Array.isArray(practitionerGuide?.["why_it_matters"])
    ? practitionerGuide["why_it_matters"].map((entry) => String(entry ?? ""))
    : [];
  assert.equal(whyItMatters[0], "customer message must stay non-final");
  const caseOutlook = result.reviewSignals.caseOutlook as Record<string, unknown> | null;
  const keyDecisionFactors: string[] = Array.isArray(caseOutlook?.["key_decision_factors"])
    ? caseOutlook["key_decision_factors"].map((entry) => String(entry ?? ""))
    : [];
  assert.equal(keyDecisionFactors[0], "proof of service");
  assert.equal(state.documentDrafts[0]?.caseId, "case_1");
  assert.equal(state.messageDrafts[0]?.caseId, "case_1");
  assert.equal(state.sourceVerificationTasks[1]?.documentDraftId, "doc_1");
  assert.equal(state.sourceVerificationTasks[2]?.messageDraftId, "msg_1");

  const richState: MemoryState = {
    inquiry: {
      id: "inq_rich",
      contactName: "Park Reviewer",
      title: "Corporate setup route review",
      description: "Need reviewer-facing checklist for corporate family tracks.",
      email: "park@example.com",
      nationality: "KR",
      currentStatus: "corporate_setup",
      requestedOutcome: "prepare setup submission route",
      targetAgency: "Seoul Office",
      generatedSummary: "Rich clue smoke input",
      classificationReason: "Corporate setup route likely",
      recommendedNextStep: "verify family track and prerequisite approvals"
    },
    caseRecord: null,
    caseTasks: [],
    sourceVerificationTasks: [],
    documentRequestTasks: [],
    documentDrafts: [],
    messageDrafts: []
  };

  const richResult = await runLawbotBridgeCaseWorkflow(
    {
      client: {
        async intakeAnalyze() {
          return {
            review_required: true,
            must_verify: ["confirm filing timeline"],
            risk_flags: ["timing_risk"]
          };
        },
        async intakeProfile() {
          return {
            review_required: true,
            must_verify_sources: ["shareholder registry"],
            risk_flags: ["family_track_mismatch"],
            matched_subtype_keys: ["corporate_setup_for_profit_track"]
          };
        },
        async createDocumentDraft() {
          return {
            draft_type: "corporate_setup_brief",
            draft: {
              document_type: "corporate_setup_brief",
              sections: { claim_purposes: ["setup route and filing sequence"] }
            },
            review_required: true,
            must_verify_sources: ["shareholder registry"]
          };
        },
        async createCustomerMessageDraft() {
          return {
            message_kind: "document_followup",
            draft: {
              subject: "Need corporate setup source documents",
              body: ["Please upload approval notice and capital statement."]
            },
            review_required: true,
            must_verify_sources: ["approval notice"],
            risk_flags: ["family_track_mismatch"],
            matched_subtype_keys: ["corporate_setup_for_profit_track"],
            supplemental_reference_candidates: [
              {
                title: "Notion archive / prior corporate setup",
                source_type: "internal_archive",
                must_verify_original: true,
                trust_level: "medium",
                usage_locations: ["reviewer_panel", "operator_assist"],
                reference_level: "supplemental"
              }
            ],
            practitioner_guide: {
              for_profit_track: [
                {
                  axis: "capital_readiness",
                  label: "for-profit capital readiness",
                  reason: "for-profit setup needs capital readiness check",
                  source_hint: "capital statement",
                  severity: "high"
                }
              ],
              sector_track: [
                {
                  axis: "regulated_sector_permit",
                  label: "regulated sector permit prerequisite",
                  reason: "regulated sector route requires permit-first check",
                  source_hint: "sector permit notice",
                  severity: "high"
                }
              ],
              approval_prerequisite_track: {
                candidate_only_clues: [
                  {
                    axis: "approval_sequence",
                    label: "approval sequence phrase match",
                    article_title: "Commercial Act Article 172",
                    snippet: "Prior approval may be required for selected setup routes.",
                    matched_axis_tags: ["approval_order", "family_route"],
                    phrase_level_rationale: "matched phrase: prior approval required",
                    source_hint: "approval notice",
                    severity: "high"
                  }
                ]
              }
            },
            case_outlook: {
              corporate_family_clues: [
                {
                  axis: "nonprofit_boundary",
                  label: "nonprofit boundary check",
                  reason: "nonprofit-family docs differ from for-profit route",
                  source_hint: "founding purpose statement"
                }
              ],
              surfaced_sector_clues: [
                {
                  axis: "sector_document_alignment",
                  label: "sector document alignment check",
                  reason: "sector-specific forms must align with family route",
                  source_hint: "sector filing checklist"
                }
              ]
            }
          };
        }
      },
      persistence: createMemoryPersistence(richState)
    },
    {
      inquiryId: "inq_rich",
      documentDraftKind: "corporate_setup_brief",
      customerMessageKind: "document_followup"
    }
  );

  const candidateClue = richResult.reviewSignals.legalAxisClues.find(
    (entry) => entry.label === "approval sequence phrase match"
  );
  assert.equal(candidateClue?.articleTitle, "Commercial Act Article 172");
  assert.equal(
    candidateClue?.snippet,
    "Prior approval may be required for selected setup routes."
  );
  assert.equal(
    candidateClue?.phraseLevelRationale,
    "matched phrase: prior approval required"
  );
  assert.deepEqual(candidateClue?.matchedAxisTags, ["approval_order", "family_route"]);

  const candidateChecklistItem = richResult.reviewSignals.sourceVerificationChecklist.items.find(
    (entry) => entry.sourceLabel === "approval notice"
  );
  assert.equal(candidateChecklistItem?.articleTitle, "Commercial Act Article 172");
  assert.equal(
    candidateChecklistItem?.phraseLevelRationale,
    "matched phrase: prior approval required"
  );
  assert.equal(
    richResult.reviewSignals.approvalWorkflowGate.blockerCodes.includes(
      "must_verify_sources_pending"
    ),
    true
  );
  assert.equal(
    richResult.reviewSignals.operatorAssistPanel.items.some((entry) =>
      entry.action.includes("Follow corporate track: for_profit_track")
    ),
    true
  );
  assert.equal(
    richResult.reviewSignals.operatorAssistPanel.items.some((entry) =>
      entry.action.includes("Follow sector track: sector_track")
    ),
    true
  );
  assert.equal(
    richResult.reviewSignals.reviewerPatternReviewPanel.items.some(
      (entry) => entry.axis === "regulated_sector_permit"
    ),
    true
  );
  assert.equal(richResult.reviewSignals.supplementalReferenceCandidates.length, 1);
  assert.equal(
    richResult.reviewSignals.reviewerReferencePanel.items[0]?.title,
    "Notion archive / prior corporate setup"
  );
  assert.equal(
    richResult.reviewSignals.reviewerReferencePanel.items[0]?.mustVerifyOriginal,
    true
  );
  assert.equal(
    richResult.reviewSignals.operatorAssistPanel.items.some((entry) =>
      entry.action.includes("Check archive reference: Notion archive / prior corporate setup")
    ),
    true
  );

  const persistedSourceTask = richState.sourceVerificationTasks.find(
    (task) => task.sourceLabel === "approval notice"
  );
  assert.equal(
    String(persistedSourceTask?.notes ?? "").includes("Article hints: Commercial Act Article 172"),
    true
  );
  assert.equal(
    String(persistedSourceTask?.notes ?? "").includes(
      "Phrase rationale: matched phrase: prior approval required"
    ),
    true
  );
  const persistedSectorTask = richState.sourceVerificationTasks.find(
    (task) => task.sourceLabel === "sector permit notice"
  );
  assert.equal(Boolean(persistedSectorTask), true);
  const persistedSectorChecklistTask = richState.sourceVerificationTasks.find(
    (task) => task.sourceLabel === "sector filing checklist"
  );
  assert.equal(Boolean(persistedSectorChecklistTask), true);
  const persistedSupplementalTask = richState.sourceVerificationTasks.find(
    (task) => task.sourceLabel === "Notion archive / prior corporate setup"
  );
  assert.equal(persistedSupplementalTask?.authorityBucket, "INTERNAL_ARCHIVE_REFERENCE");
  assert.equal(
    String(persistedSupplementalTask?.notes ?? "").includes("Internal archive (internal_archive)"),
    true
  );

  console.log("lawbot-bridge-case-workflow-test-ok");
}

run();
