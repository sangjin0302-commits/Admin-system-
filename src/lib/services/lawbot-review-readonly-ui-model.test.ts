const readonlyAssert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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
  readonlyAssert.equal(serialized.includes("\u0085"), false);
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

  const clientPath = path.resolve(
    __dirname,
    "..",
    "..",
    "components",
    "admin",
    "lawbot-review-readonly-client.tsx"
  );
  const clientSource = fs.readFileSync(clientPath, "utf8");
  readonlyAssert.equal(clientSource.includes("현재 이 화면은 읽기 전용이며"), false);
  readonlyAssert.equal(clientSource.includes("model.readonlyNotice"), true);
  readonlyAssert.equal(clientSource.includes("run-lawbot-workflow"), false);
  readonlyAssert.equal(clientSource.includes('"mustVerify":'), false);
  readonlyAssert.equal(clientSource.includes('"mustVerifySources":'), false);
  readonlyAssert.equal(clientSource.includes('"riskFlags":'), false);

  const lowerClientSource = clientSource.toLowerCase();
  readonlyAssert.equal(lowerClientSource.includes("approve"), false);
  readonlyAssert.equal(lowerClientSource.includes("send"), false);
  readonlyAssert.equal(lowerClientSource.includes("submit"), false);
  readonlyAssert.equal(lowerClientSource.includes("rerun"), false);
  readonlyAssert.equal(lowerClientSource.includes("retry"), false);

  const detailPath = path.resolve(
    __dirname,
    "..",
    "..",
    "components",
    "admin",
    "inquiry-detail-right-column.tsx"
  );
  const detailSource = fs.readFileSync(detailPath, "utf8");
  readonlyAssert.equal(detailSource.includes("Lawbot 리뷰 결과 보기"), true);
  readonlyAssert.equal(
    detailSource.includes("/admin/inquiries/${input.lawbotPanel.inquiryId}/lawbot-review"),
    true
  );

  readonlyAssert.equal(
    LAWBOT_REVIEW_READONLY_NOTICE,
    "현재 이 화면은 읽기 전용이며 승인/발송/제출 기능은 비활성화되어 있습니다."
  );
  console.log("lawbot-review-readonly-ui-model-test-ok");
}

runLawbotReviewReadonlyUiModelTest();
