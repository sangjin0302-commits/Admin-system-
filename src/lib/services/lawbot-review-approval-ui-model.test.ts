const approvalUiAssert = require("node:assert/strict");

const {
  areLawbotApprovalChecksComplete,
  buildLawbotApprovalRequestBody,
  getLawbotReviewApprovalPanelState
} = require("./lawbot-review-approval-ui-model.ts");
const {
  buildLawbotReviewReadonlyUiModel
} = require("./lawbot-review-readonly-ui-model.ts");

function createSafeReview(overrides = {}) {
  return {
    inquiryId: "cmof24jza0000l704mik5cy3x",
    caseId: "case_1",
    caseNumber: "CASE-001",
    workflowStatus: "APPROVAL_PENDING",
    executionStatus: "success",
    executionSummary: "Safe approval review summary.",
    updatedAt: "2026-04-30T10:00:00.000Z",
    reviewRequired: true,
    approvalGate: {
      approvalRequired: true,
      externalActionAllowed: false,
      reasonCodes: ["manual_approval_required"]
    },
    reviewSignals: {
      mustVerifyCount: 1,
      mustVerifySourcesCount: 2,
      riskFlagsCount: 1,
      sourceVerificationChecklist: { totalRequired: 2 }
    },
    reviewQueue: {
      totalDrafts: 2,
      approvalPendingDrafts: 2,
      documentDrafts: [
        {
          id: "doc_1",
          status: "APPROVAL_PENDING",
          reviewRequired: true,
          createdAt: "2026-04-30T09:00:00.000Z",
          updatedAt: "2026-04-30T09:30:00.000Z"
        }
      ],
      messageDrafts: [
        {
          id: "msg_1",
          status: "APPROVAL_PENDING",
          reviewRequired: true,
          createdAt: "2026-04-30T09:05:00.000Z",
          updatedAt: "2026-04-30T09:35:00.000Z"
        }
      ]
    },
    ...overrides
  };
}

function assertNoRawReviewFields(value: unknown) {
  const serialized = JSON.stringify(value);
  approvalUiAssert.equal(serialized.includes("\"mustVerify\":"), false);
  approvalUiAssert.equal(serialized.includes("\"mustVerifySources\":"), false);
  approvalUiAssert.equal(serialized.includes("\"riskFlags\":"), false);
  approvalUiAssert.equal(/[ìëíÂ\uFFFD]/.test(serialized), false);
}

function runLawbotReviewApprovalUiModelTest() {
  const pendingModel = buildLawbotReviewReadonlyUiModel(createSafeReview());
  approvalUiAssert.ok(pendingModel);
  const pendingPanel = getLawbotReviewApprovalPanelState(pendingModel);
  approvalUiAssert.equal(pendingPanel.state, "approval_pending");
  approvalUiAssert.equal(pendingPanel.canShowApprovalControls, true);

  approvalUiAssert.equal(
    areLawbotApprovalChecksComplete({
      manualReviewChecked: true,
      sourcesChecked: true,
      riskFlagsChecked: false,
      draftsReviewed: true
    }),
    false
  );
  approvalUiAssert.equal(
    areLawbotApprovalChecksComplete({
      manualReviewChecked: true,
      sourcesChecked: true,
      riskFlagsChecked: true,
      draftsReviewed: true
    }),
    true
  );

  approvalUiAssert.deepEqual(
    buildLawbotApprovalRequestBody(
      {
        manualReviewChecked: true,
        sourcesChecked: true,
        riskFlagsChecked: true,
        draftsReviewed: true
      },
      "  reviewed safely  "
    ),
    {
      manualReviewChecked: true,
      sourcesChecked: true,
      riskFlagsChecked: true,
      draftsReviewed: true,
      operatorNote: "reviewed safely",
      expectedWorkflowStatus: "APPROVAL_PENDING"
    }
  );

  const approvedModel = buildLawbotReviewReadonlyUiModel(
    createSafeReview({
      workflowStatus: "APPROVED",
      reviewQueue: {
        totalDrafts: 2,
        approvalPendingDrafts: 0,
        documentDrafts: [
          {
            id: "doc_1",
            status: "APPROVED",
            reviewRequired: true,
            createdAt: "2026-04-30T09:00:00.000Z",
            updatedAt: "2026-04-30T10:10:00.000Z"
          }
        ],
        messageDrafts: [
          {
            id: "msg_1",
            status: "APPROVED",
            reviewRequired: true,
            createdAt: "2026-04-30T09:05:00.000Z",
            updatedAt: "2026-04-30T10:10:00.000Z"
          }
        ]
      }
    })
  );
  approvalUiAssert.ok(approvedModel);
  const approvedPanel = getLawbotReviewApprovalPanelState(approvedModel);
  approvalUiAssert.equal(approvedPanel.state, "approved");
  approvalUiAssert.equal(approvedPanel.canShowApprovalControls, false);
  approvalUiAssert.equal(approvedModel.reviewQueue.documentDrafts[0].status, "APPROVED");
  approvalUiAssert.equal(approvedModel.reviewQueue.messageDrafts[0].status, "APPROVED");
  approvalUiAssert.equal(approvedModel.approvalGate.externalActionAllowed, false);
  assertNoRawReviewFields(approvedModel);

  // Additional model-level coverage (replaces removed source-grep assertions).

  // Unknown / unexpected workflow status must fall back to the blocked panel
  // with approval controls hidden.
  const blockedModel = buildLawbotReviewReadonlyUiModel(
    createSafeReview({ workflowStatus: "EXECUTION_FAILED" })
  );
  const blockedPanel = getLawbotReviewApprovalPanelState(blockedModel);
  approvalUiAssert.equal(blockedPanel.state, "blocked");
  approvalUiAssert.equal(blockedPanel.canShowApprovalControls, false);
  approvalUiAssert.equal(
    blockedPanel.statusMessage,
    "현재 워크플로 상태에서는 내부 승인 처리를 할 수 없습니다."
  );

  // Panel state must normalize casing / whitespace of workflowStatus.
  const messyStatusModel = buildLawbotReviewReadonlyUiModel(
    createSafeReview({ workflowStatus: "  approval_pending  " })
  );
  const messyStatusPanel = getLawbotReviewApprovalPanelState(messyStatusModel);
  approvalUiAssert.equal(messyStatusPanel.state, "approval_pending");
  approvalUiAssert.equal(messyStatusPanel.canShowApprovalControls, true);

  // areLawbotApprovalChecksComplete must reject any single unchecked box.
  approvalUiAssert.equal(
    areLawbotApprovalChecksComplete({
      manualReviewChecked: false,
      sourcesChecked: true,
      riskFlagsChecked: true,
      draftsReviewed: true
    }),
    false
  );
  approvalUiAssert.equal(
    areLawbotApprovalChecksComplete({
      manualReviewChecked: true,
      sourcesChecked: true,
      riskFlagsChecked: true,
      draftsReviewed: false
    }),
    false
  );

  // buildLawbotApprovalRequestBody must trim the note to empty and always
  // pin the expected workflow status regardless of check values.
  approvalUiAssert.deepEqual(
    buildLawbotApprovalRequestBody(
      {
        manualReviewChecked: false,
        sourcesChecked: false,
        riskFlagsChecked: false,
        draftsReviewed: false
      },
      "   "
    ),
    {
      manualReviewChecked: false,
      sourcesChecked: false,
      riskFlagsChecked: false,
      draftsReviewed: false,
      operatorNote: "",
      expectedWorkflowStatus: "APPROVAL_PENDING"
    }
  );

  console.log("lawbot-review-approval-ui-model-test-ok");
}

runLawbotReviewApprovalUiModelTest();

export {};
