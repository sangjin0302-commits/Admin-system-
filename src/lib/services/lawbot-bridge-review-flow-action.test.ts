import assert from "node:assert/strict";

import { handleGetLawbotReviewFlowRequest } from "./lawbot-bridge-review-flow-action";
import { getLawbotBridgeReviewFlowByInquiryId } from "./lawbot-bridge-review-flow-service";
import type { LawbotReviewFlowResult } from "./lawbot-bridge-review-flow-service";
import type { LawbotBridgeReadonlySummary } from "./lawbot-bridge-readonly-summary-service";

function createReviewResult(): LawbotReviewFlowResult {
  return {
    inquiryId: "inq_1",
    caseId: "case_1",
    caseNumber: "CASE-TEST-001",
    workflowStatus: "APPROVAL_PENDING",
    executionStatus: "success",
    executionSummary: "Drafts are created and waiting for approval.",
    updatedAt: new Date("2026-04-23T01:00:00.000Z").toISOString(),
    reviewSignals: {
      reviewRequired: true,
      mustVerify: ["confirm service route"],
      mustVerifySources: ["disposition notice"],
      riskFlags: ["timing_risk"],
      matchedSubtypeKeys: ["admin_appeal_refusal"],
      practitionerGuide: {
        what_to_check_first: ["service date"],
        candidate_only_clues: [
          {
            axis: "refusal_notice_proof",
            label: "refusal notice phrase match",
            article_title: "Immigration Act Article 23",
            snippet: "Documents must show clear receipt route."
          }
        ]
      },
      caseOutlook: {
        key_decision_factors: ["proof of receipt"],
        missing_case_facts: ["service record"]
      },
      legalAxisClues: [
        {
          id: "case_outlook:refusal_notice_proof",
          axis: "refusal_notice_proof",
          label: "refusal notice phrase match",
          reason: "Candidate-only clue requires source verification.",
          sourceHint: "disposition notice",
          articleTitle: "Immigration Act Article 23",
          snippet: "Documents must show clear receipt route.",
          matchedAxisTags: ["service_route", "receipt_proof"],
          phraseLevelRationale: "matched phrase: notice of refusal delivered",
          severity: "high",
          origin: "case_outlook"
        }
      ],
      reviewerAttentionPanel: {
        reviewRequired: true,
        headline: "Manual review is required before any external action.",
        items: [
          {
            label: "disposition notice",
            reason: "Source verification is required before approval.",
            severity: "high",
            origin: "must_verify_sources"
          }
        ]
      },
      reviewerPatternReviewPanel: {
        headline: "Pattern-level review focus from legal axis clues.",
        items: [
          {
            axis: "refusal_notice_proof",
            clueCount: 1,
            highestSeverity: "high",
            sampleLabels: ["refusal notice phrase match"]
          }
        ]
      },
      operatorAssistPanel: {
        headline: "Operator assist suggestions from bridge compact response.",
        items: [
          {
            action: "Verify source: disposition notice",
            detail: "Source verification is required.",
            origin: "must_verify_sources"
          }
        ]
      },
      reviewerReferencePanel: {
        headline: "Internal archive references (supplemental, non-authoritative).",
        items: []
      },
      supplementalReferenceCandidates: [],
      sourceVerificationChecklist: {
        headline: "Verify all required sources before approval.",
        items: [
          {
            id: "source:disposition_notice",
            sourceLabel: "disposition notice",
            authorityBucket: "CASE_DOCUMENT",
            sourceCitation: "disposition notice",
            notes:
              "Article hints: Immigration Act Article 23 / Phrase rationale: matched phrase: notice of refusal delivered",
            articleTitle: "Immigration Act Article 23",
            snippet: "Documents must show clear receipt route.",
            matchedAxisTags: ["service_route", "receipt_proof"],
            phraseLevelRationale: "matched phrase: notice of refusal delivered",
            sourceType: null,
            mustVerifyOriginal: null,
            trustLevel: null,
            usageLocations: [],
            referenceLevel: null,
            required: true,
            reviewRequired: true
          }
        ],
        totalRequired: 1
      },
      approvalWorkflowGate: {
        canProceedWithoutApproval: false,
        requiresManualReview: true,
        blockerCodes: ["review_required", "must_verify_sources_pending"],
        cautionRiskFlags: ["timing_risk"],
        summary: "Approval gate blocked by bridge review signals."
      }
    },
    createdCounts: {
      caseTasks: 4,
      sourceVerificationTasks: 1,
      documentRequestTasks: 1,
      documentDrafts: 1,
      messageDrafts: 1
    },
    reviewQueue: {
      documentDrafts: [
        {
          id: "doc_1",
          sourceType: "document",
          draftTypeOrKind: "admin_appeal_brief",
          titleOrSubject: "Admin Appeal Brief",
          status: "APPROVAL_PENDING",
          reviewRequired: true,
          mustVerifySources: ["disposition notice"],
          riskFlags: ["timing_risk"],
          createdAt: new Date("2026-04-23T00:40:00.000Z").toISOString(),
          updatedAt: new Date("2026-04-23T00:45:00.000Z").toISOString()
        }
      ],
      messageDrafts: [
        {
          id: "msg_1",
          sourceType: "message",
          draftTypeOrKind: "document_followup",
          titleOrSubject: "Additional documents needed",
          status: "APPROVAL_PENDING",
          reviewRequired: true,
          mustVerifySources: ["disposition notice"],
          riskFlags: ["timing_risk"],
          createdAt: new Date("2026-04-23T00:46:00.000Z").toISOString(),
          updatedAt: new Date("2026-04-23T00:50:00.000Z").toISOString()
        }
      ],
      totalDrafts: 2,
      approvalPendingDrafts: 2
    },
    approvalGate: {
      approvalRequired: true,
      externalActionAllowed: false,
      reasonCodes: [
        "manual_approval_required",
        "review_required",
        "must_verify_sources_pending",
        "risk_flags_present",
        "draft_approval_pending"
      ]
    }
  };
}

function createReadonlySummary(): LawbotBridgeReadonlySummary {
  return {
    inquiryId: "inq_2",
    caseId: "case_2",
    caseNumber: "CASE-TEST-002",
    workflowStatus: "APPROVAL_PENDING",
    executionStatus: "success",
    executionSummary: "Drafts are created and waiting for approval.",
    updatedAt: new Date("2026-04-23T02:00:00.000Z").toISOString(),
    reviewSignals: {
      reviewRequired: true,
      mustVerify: ["confirm filing timeline"],
      mustVerifySources: ["refusal notice"],
      riskFlags: ["timing_risk"],
      matchedSubtypeKeys: ["admin_appeal_refusal"],
      practitionerGuide: {
        what_to_check_first: ["service date"]
      },
      caseOutlook: {
        key_decision_factors: ["proof of receipt"],
        missing_case_facts: ["delivery route"]
      },
      legalAxisClues: [],
      reviewerAttentionPanel: {
        reviewRequired: true,
        headline: "Manual review is required before external action.",
        items: []
      },
      reviewerPatternReviewPanel: {
        headline: "Pattern-level review focus.",
        items: []
      },
      operatorAssistPanel: {
        headline: "Operator assist suggestions.",
        items: []
      },
      reviewerReferencePanel: {
        headline: "Internal archive references (supplemental, non-authoritative).",
        items: []
      },
      supplementalReferenceCandidates: [],
      sourceVerificationChecklist: {
        headline: "Verify all required sources before approval.",
        items: [],
        totalRequired: 1
      },
      approvalWorkflowGate: {
        canProceedWithoutApproval: false,
        requiresManualReview: true,
        blockerCodes: ["review_required", "must_verify_sources_pending"],
        cautionRiskFlags: ["timing_risk"],
        summary: "Approval gate blocked by review signals."
      }
    },
    createdCounts: {
      caseTasks: 2,
      sourceVerificationTasks: 1,
      documentRequestTasks: 1,
      documentDrafts: 1,
      messageDrafts: 0
    }
  };
}

async function testSuccess() {
  const response = await handleGetLawbotReviewFlowRequest("inq_1", {
    loadReviewFlow: async () => createReviewResult()
  });

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { result: LawbotReviewFlowResult };
  assert.equal(payload.result.inquiryId, "inq_1");
  assert.equal(payload.result.reviewSignals.reviewRequired, true);
  assert.deepEqual(payload.result.reviewSignals.mustVerifySources, ["disposition notice"]);
  assert.equal(
    payload.result.reviewSignals.legalAxisClues[0]?.articleTitle,
    "Immigration Act Article 23"
  );
  assert.equal(payload.result.reviewQueue.totalDrafts, 2);
  assert.equal(payload.result.approvalGate.externalActionAllowed, false);
}

async function testNotFound() {
  const response = await handleGetLawbotReviewFlowRequest("missing", {
    loadReviewFlow: async () => null
  });

  assert.equal(response.status, 404);
}

async function testActionWithServiceIntegration() {
  const response = await handleGetLawbotReviewFlowRequest("inq_2", {
    loadReviewFlow: (inquiryId) =>
      getLawbotBridgeReviewFlowByInquiryId(inquiryId, {
        loadSummary: async (id) => (id === "inq_2" ? createReadonlySummary() : null),
        loadDocumentDrafts: async () => [
          {
            id: "doc_2",
            draftType: "admin_appeal_brief",
            title: "Administrative Appeal Brief",
            status: "APPROVAL_PENDING",
            reviewRequired: true,
            mustVerifySources: JSON.stringify(["refusal notice"]),
            riskFlags: JSON.stringify(["timing_risk"]),
            createdAt: new Date("2026-04-23T01:30:00.000Z"),
            updatedAt: new Date("2026-04-23T01:40:00.000Z")
          }
        ],
        loadMessageDrafts: async () => []
      })
  });

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { result: LawbotReviewFlowResult };
  assert.equal(payload.result.inquiryId, "inq_2");
  assert.equal(payload.result.reviewSignals.reviewRequired, true);
  assert.deepEqual(payload.result.reviewSignals.mustVerifySources, ["refusal notice"]);
  assert.equal(payload.result.reviewQueue.documentDrafts.length, 1);
  assert.equal(payload.result.reviewQueue.messageDrafts.length, 0);
  assert.equal(payload.result.approvalGate.externalActionAllowed, false);
}

async function run() {
  await testSuccess();
  await testNotFound();
  await testActionWithServiceIntegration();
  console.log("lawbot-bridge-review-flow-action-test-ok");
}

run();
