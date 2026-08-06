const readonlyAssert = require("node:assert/strict");

const {
  buildLawbotReviewReadonlyUiModel,
  LAWBOT_REVIEW_READONLY_NOTICE
} = require("./lawbot-review-readonly-ui-model.ts");

function runLawbotReviewReadonlyUiModelTest() {
  const raw = {
    inquiryId: "cmof24jza0000l704mik5cy3x",
    caseId: "case_1",
    caseNumber: "CASE-001",
    workflowStatus: "APPROVAL_PENDING",
    executionStatus: "success",
    executionSummary: "정상 요약",
    updatedAt: "2026-04-27T10:00:00.000Z",
    reviewRequired: true,
    approvalGate: {
      approvalRequired: true,
      externalActionAllowed: false,
      reasonCodes: ["manual_approval_required", "review_required"]
    },
    reviewSignals: {
      mustVerifyCount: 1,
      mustVerifySourcesCount: 2,
      riskFlagsCount: 1,
      sourceVerificationChecklist: { totalRequired: 3 },
      mustVerify: ["ìë¬¸ íì¸"],
      mustVerifySources: ["ì¶ì² íì¸ íì"],
      riskFlags: ["ìí ì í¸ íì¸ íì"]
    },
    reviewQueue: {
      totalDrafts: 2,
      approvalPendingDrafts: 2,
      documentDrafts: [
        {
          id: "doc_1",
          status: "APPROVAL_PENDING",
          reviewRequired: true,
          mustVerifySources: ["ì¶ì² íì¸ íì"],
          riskFlags: ["ìí ì í¸ íì¸ íì"],
          createdAt: "2026-04-27T09:50:00.000Z",
          updatedAt: "2026-04-27T09:55:00.000Z"
        }
      ],
      messageDrafts: [
        {
          id: "msg_1",
          status: "APPROVAL_PENDING",
          reviewRequired: true,
          mustVerifySources: ["ì¶ì² íì¸ íì"],
          riskFlags: ["ìí ì í¸ íì¸ íì"],
          createdAt: "2026-04-27T09:51:00.000Z",
          updatedAt: "2026-04-27T09:56:00.000Z"
        }
      ]
    }
  };

  const model = buildLawbotReviewReadonlyUiModel(raw);
  readonlyAssert.ok(model);

  const serialized = JSON.stringify(model);
  readonlyAssert.equal(serialized.includes('"mustVerify":'), false);
  readonlyAssert.equal(serialized.includes('"mustVerifySources":'), false);
  readonlyAssert.equal(serialized.includes('"riskFlags":'), false);
  readonlyAssert.equal(serialized.includes("ì"), false);
  readonlyAssert.equal(serialized.includes("ë"), false);
  readonlyAssert.equal(serialized.includes("í"), false);
  readonlyAssert.equal(serialized.includes("Â"), false);
  readonlyAssert.equal(serialized.includes(""), false);
  readonlyAssert.equal(serialized.includes("\uFFFD"), false);

  readonlyAssert.equal(
    model.readonlyNotice,
    "현재 이 화면은 읽기 전용이며 승인/발송/제출 기능은 비활성화되어 있습니다."
  );
  readonlyAssert.equal(model.reviewSignals.mustVerifyCount, 1);
  readonlyAssert.equal(model.reviewSignals.mustVerifySourcesCount, 2);
  readonlyAssert.equal(model.reviewSignals.riskFlagsCount, 1);
  readonlyAssert.equal(model.reviewSignals.sourceVerificationChecklist.totalRequired, 3);
  readonlyAssert.equal(model.reviewQueue.documentDrafts.length, 1);
  readonlyAssert.equal(model.reviewQueue.messageDrafts.length, 1);

  // Additional model-level coverage (replaces removed source-grep assertions).

  // Null/undefined-ish input must produce a null model, not throw.
  readonlyAssert.equal(buildLawbotReviewReadonlyUiModel(null), null);
  readonlyAssert.equal(buildLawbotReviewReadonlyUiModel(undefined), null);

  // Missing/garbage fields must be coerced to safe fallbacks, never crash.
  const emptyModel = buildLawbotReviewReadonlyUiModel({});
  readonlyAssert.ok(emptyModel);
  readonlyAssert.equal(emptyModel.inquiryId, "unknown-inquiry");
  readonlyAssert.equal(emptyModel.caseId, null);
  readonlyAssert.equal(emptyModel.caseNumber, null);
  readonlyAssert.equal(emptyModel.workflowStatus, "APPROVAL_PENDING");
  readonlyAssert.equal(emptyModel.executionStatus, "success");
  readonlyAssert.equal(emptyModel.executionSummary, "원문 확인 필요");
  readonlyAssert.equal(emptyModel.reviewRequired, true);
  readonlyAssert.equal(emptyModel.readonlyNotice, LAWBOT_REVIEW_READONLY_NOTICE);
  // Empty reasonCodes must fall back to the default gate reason.
  readonlyAssert.deepEqual(emptyModel.approvalGate.reasonCodes, ["manual_approval_required"]);
  readonlyAssert.equal(emptyModel.approvalGate.approvalRequired, true);
  readonlyAssert.equal(emptyModel.approvalGate.externalActionAllowed, false);
  // Counts default to zero and draft lists default to empty.
  readonlyAssert.equal(emptyModel.reviewSignals.mustVerifyCount, 0);
  readonlyAssert.equal(emptyModel.reviewQueue.documentDrafts.length, 0);
  readonlyAssert.equal(emptyModel.reviewQueue.messageDrafts.length, 0);
  readonlyAssert.equal(emptyModel.reviewQueue.totalDrafts, 0);

  // A mojibake executionSummary must be scrubbed to the safe fallback while
  // the overall model is still returned.
  const mojibakeModel = buildLawbotReviewReadonlyUiModel({
    ...raw,
    executionSummary: "ìë¬¸ íì¸"
  });
  readonlyAssert.ok(mojibakeModel);
  readonlyAssert.equal(mojibakeModel.executionSummary, "원문 확인 필요");
  readonlyAssert.equal(mojibakeModel.readonlyNotice, LAWBOT_REVIEW_READONLY_NOTICE);

  // reasonCodes must be normalized (non-alnum replaced) and de-duplicated.
  const reasonModel = buildLawbotReviewReadonlyUiModel({
    ...raw,
    approvalGate: {
      approvalRequired: true,
      externalActionAllowed: false,
      reasonCodes: ["manual approval!", "manual approval!", "review_required"]
    }
  });
  readonlyAssert.deepEqual(reasonModel.approvalGate.reasonCodes, [
    "manual_approval_",
    "review_required"
  ]);

  // Negative / fractional counts must be floored to a safe non-negative int.
  const numberModel = buildLawbotReviewReadonlyUiModel({
    ...raw,
    reviewSignals: {
      mustVerifyCount: -5,
      mustVerifySourcesCount: 2.9,
      riskFlagsCount: 0,
      sourceVerificationChecklist: { totalRequired: 3 }
    }
  });
  readonlyAssert.equal(numberModel.reviewSignals.mustVerifyCount, 0);
  readonlyAssert.equal(numberModel.reviewSignals.mustVerifySourcesCount, 2);

  readonlyAssert.equal(
    LAWBOT_REVIEW_READONLY_NOTICE,
    "현재 이 화면은 읽기 전용이며 승인/발송/제출 기능은 비활성화되어 있습니다."
  );
  console.log("lawbot-review-readonly-ui-model-test-ok");
}

runLawbotReviewReadonlyUiModelTest();

export {};
