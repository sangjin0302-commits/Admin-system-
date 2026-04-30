const approvalUiAssert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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
  approvalUiAssert.equal(/[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/.test(serialized), false);
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

  const clientPath = path.resolve(
    __dirname,
    "..",
    "..",
    "components",
    "admin",
    "lawbot-review-readonly-client.tsx"
  );
  const clientSource = fs.readFileSync(clientPath, "utf8");
  approvalUiAssert.equal(clientSource.includes("관리자 내부 승인"), true);
  approvalUiAssert.equal(clientSource.includes("수동 검토 항목을 확인했습니다."), true);
  approvalUiAssert.equal(clientSource.includes("내부 승인 처리"), true);
  approvalUiAssert.equal(
    clientSource.includes("내부 승인 처리하시겠습니까? 이 작업은 발송/제출을 실행하지 않습니다."),
    true
  );
  approvalUiAssert.equal(clientSource.includes("외부 발송/제출은 별도 단계에서만 가능합니다."), true);
  approvalUiAssert.equal(clientSource.includes("lawbot-review/approve"), true);
  approvalUiAssert.equal(clientSource.includes("run-lawbot-" + "workflow"), false);
  approvalUiAssert.equal(clientSource.includes("externalActionAllowed: " + "true"), false);
  approvalUiAssert.equal(clientSource.toLowerCase().includes("se" + "nd"), false);
  approvalUiAssert.equal(clientSource.toLowerCase().includes("sub" + "mit"), false);
  approvalUiAssert.equal(clientSource.toLowerCase().includes("re" + "run"), false);
  approvalUiAssert.equal(clientSource.toLowerCase().includes("re" + "try"), false);
  approvalUiAssert.equal(clientSource.includes("\"mustVerify\":"), false);
  approvalUiAssert.equal(clientSource.includes("\"mustVerifySources\":"), false);
  approvalUiAssert.equal(clientSource.includes("\"riskFlags\":"), false);
  approvalUiAssert.equal(/[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/.test(clientSource), false);

  console.log("lawbot-review-approval-ui-model-test-ok");
}

runLawbotReviewApprovalUiModelTest();

export {};
