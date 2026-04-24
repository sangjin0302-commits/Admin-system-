import assert from "node:assert/strict";

import { getLawbotBridgeReviewFlowByInquiryId } from "./lawbot-bridge-review-flow-service.ts";
import type { LawbotBridgeReadonlySummary } from "./lawbot-bridge-readonly-summary-service.ts";

function createReadonlySummary(): LawbotBridgeReadonlySummary {
  return {
    inquiryId: "inq_1",
    caseId: "case_1",
    caseNumber: "CASE-TEST-001",
    workflowStatus: "APPROVAL_PENDING",
    executionStatus: "success",
    executionSummary: "Workflow completed and waiting for approval.",
    updatedAt: new Date("2026-04-23T03:00:00.000Z").toISOString(),
    reviewSignals: {
      reviewRequired: true,
      mustVerify: ["confirm timeline"],
      mustVerifySources: ["disposition notice"],
      riskFlags: ["timing_risk"],
      matchedSubtypeKeys: ["admin_appeal_refusal"],
      practitionerGuide: {
        what_to_check_first: ["service date"],
        supplemental_reference_candidates: [
          {
            title: "Notion archive / prior filing package",
            source_type: "internal_archive",
            must_verify_original: true,
            trust_level: "medium",
            usage_locations: ["reviewer_panel"],
            reference_level: "supplemental"
          }
        ]
      },
      caseOutlook: {
        key_decision_factors: ["proof of receipt"],
        missing_case_facts: ["service route"]
      },
      legalAxisClues: [],
      reviewerAttentionPanel: {
        reviewRequired: true,
        headline: "Review required before external action.",
        items: []
      },
      reviewerPatternReviewPanel: {
        headline: "Pattern-level review",
        items: []
      },
      operatorAssistPanel: {
        headline: "Operator assist suggestions",
        items: []
      },
      reviewerReferencePanel: {
        headline: "Internal archive references (supplemental, non-authoritative).",
        items: [
          {
            id: "supplemental:notion_archive_prior_filing_package:supplemental",
            title: "Notion archive / prior filing package",
            sourceType: "internal_archive",
            mustVerifyOriginal: true,
            trustLevel: "medium",
            usageLocations: ["reviewer_panel"],
            referenceLevel: "supplemental",
            reviewHint: "Verify original archive row before using this reference."
          }
        ]
      },
      supplementalReferenceCandidates: [
        {
          title: "Notion archive / prior filing package",
          sourceType: "internal_archive",
          mustVerifyOriginal: true,
          trustLevel: "medium",
          usageLocations: ["reviewer_panel"],
          referenceLevel: "supplemental"
        }
      ],
      sourceVerificationChecklist: {
        headline: "Verify required sources",
        items: [],
        totalRequired: 1
      },
      approvalWorkflowGate: {
        canProceedWithoutApproval: false,
        requiresManualReview: true,
        blockerCodes: ["review_required"],
        cautionRiskFlags: ["timing_risk"],
        summary: "Approval gate blocked."
      }
    },
    createdCounts: {
      caseTasks: 4,
      sourceVerificationTasks: 1,
      documentRequestTasks: 1,
      documentDrafts: 1,
      messageDrafts: 1
    }
  };
}

async function testBuildReviewFlowFromStoredSignals() {
  const result = await getLawbotBridgeReviewFlowByInquiryId("inq_1", {
    loadSummary: async () => createReadonlySummary(),
    loadDocumentDrafts: async () => [
      {
        id: "doc_1",
        draftType: "admin_appeal_brief",
        title: "Administrative Appeal Brief",
        status: "APPROVAL_PENDING",
        reviewRequired: true,
        mustVerifySources: JSON.stringify(["disposition notice"]),
        riskFlags: JSON.stringify(["timing_risk"]),
        createdAt: new Date("2026-04-23T02:20:00.000Z"),
        updatedAt: new Date("2026-04-23T02:40:00.000Z")
      }
    ],
    loadMessageDrafts: async () => [
      {
        id: "msg_1",
        messageKind: "document_followup",
        subject: "Please upload missing documents",
        status: "APPROVAL_PENDING",
        reviewRequired: true,
        mustVerifySources: JSON.stringify(["disposition notice"]),
        riskFlags: JSON.stringify(["timing_risk"]),
        createdAt: new Date("2026-04-23T02:21:00.000Z"),
        updatedAt: new Date("2026-04-23T02:41:00.000Z")
      }
    ]
  });

  assert.ok(result);
  assert.equal(result.reviewSignals.reviewRequired, true);
  assert.deepEqual(result.reviewSignals.mustVerifySources, ["disposition notice"]);
  assert.deepEqual(result.reviewSignals.riskFlags, ["timing_risk"]);
  assert.deepEqual(result.reviewSignals.practitionerGuide, {
    what_to_check_first: ["service date"],
    supplemental_reference_candidates: [
      {
        title: "Notion archive / prior filing package",
        source_type: "internal_archive",
        must_verify_original: true,
        trust_level: "medium",
        usage_locations: ["reviewer_panel"],
        reference_level: "supplemental"
      }
    ]
  });
  assert.deepEqual(result.reviewSignals.caseOutlook, {
    key_decision_factors: ["proof of receipt"],
    missing_case_facts: ["service route"]
  });
  assert.equal(result.reviewQueue.documentDrafts.length, 1);
  assert.equal(result.reviewQueue.messageDrafts.length, 1);
  assert.equal(result.reviewQueue.totalDrafts, 2);
  assert.equal(result.reviewSignals.supplementalReferenceCandidates.length, 1);
  assert.equal(
    result.reviewSignals.reviewerReferencePanel.items[0]?.title,
    "Notion archive / prior filing package"
  );
  assert.equal(result.approvalGate.approvalRequired, true);
  assert.equal(result.approvalGate.externalActionAllowed, false);
}

async function testReturnsNullWhenSummaryMissing() {
  let documentDraftLoaderCalled = false;
  let messageDraftLoaderCalled = false;

  const result = await getLawbotBridgeReviewFlowByInquiryId("missing", {
    loadSummary: async () => null,
    loadDocumentDrafts: async () => {
      documentDraftLoaderCalled = true;
      return [];
    },
    loadMessageDrafts: async () => {
      messageDraftLoaderCalled = true;
      return [];
    }
  });

  assert.equal(result, null);
  assert.equal(documentDraftLoaderCalled, false);
  assert.equal(messageDraftLoaderCalled, false);
}

async function run() {
  await testBuildReviewFlowFromStoredSignals();
  await testReturnsNullWhenSummaryMissing();
  console.log("lawbot-bridge-review-flow-service-test-ok");
}

run();
