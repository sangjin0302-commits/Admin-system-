const safeAssert = require("node:assert/strict");

const { buildLawbotReviewSafeDto } = require("./lawbot-bridge-review-safe-dto.ts");

const FORBIDDEN_MOJIBAKE_CHAR_PATTERN = /[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/;

function runSafeDtoTest() {
  const raw = {
    inquiryId: "cmof24jza0000l704mik5cy3x",
    caseId: "case_1",
    caseNumber: "CASE-001",
    workflowStatus: "APPROVAL_PENDING",
    executionStatus: "success",
    executionSummary: "\u00ec\u00eb\u00ac\u00b8 \u00ed\u00ec\u00b8",
    updatedAt: "2026-04-27T09:00:00.000Z",
    reviewSignals: {
      reviewRequired: true,
      mustVerify: ["\u00ec\u00eb\u00ac\u00b8 \u00ed\u00ec\u00b8"],
      mustVerifySources: [
        "\u00ec\u00b6\u00ec\u00b2 \u00ed\u00ec\u00b8 \u00ed\u00ec",
        "ì¶ì² íì¸ íì"
      ],
      riskFlags: [
        "\u00ec\u00ad \u00ec \u00ed\u00b8 \u00ed\u00ec\u00b8 \u00ed\u00ec",
        "ìí ì í¸ íì¸ íì"
      ],
      legalAxisClues: [{ label: "\u00ec\u00a1\u00b0\u00eb\u00ac\u00b8", sourceHint: "\u00c2" }],
      reviewerAttentionPanel: { items: [{ label: "\u00ec\u00eb\u00ac\u00b8" }] },
      reviewerPatternReviewPanel: { items: [{ sampleLabels: ["\u00eb\u00b2"] }] },
      operatorAssistPanel: { items: [{ action: "\u00ed" }] },
      sourceVerificationChecklist: {
        totalRequired: 2,
        items: [{ sourceLabel: "\u00ec\u00eb\u00ac\u00b8", notes: "\u0085" }]
      }
    },
    reviewQueue: {
      totalDrafts: 2,
      approvalPendingDrafts: 2,
      documentDrafts: [
        {
          id: "doc_1",
          status: "APPROVAL_PENDING",
          reviewRequired: true,
          mustVerifySources: ["\u00ec\u00b6\u00ec\u00b2 \u00ed\u00ec\u00b8 \u00ed\u00ec"],
          riskFlags: ["\u00ec\u00ad \u00ec \u00ed\u00b8 \u00ed\u00ec\u00b8 \u00ed\u00ec"],
          createdAt: "2026-04-27T08:50:00.000Z",
          updatedAt: "2026-04-27T08:55:00.000Z"
        }
      ],
      messageDrafts: [
        {
          id: "msg_1",
          status: "APPROVAL_PENDING",
          reviewRequired: true,
          mustVerifySources: ["\u00ec\u00b6\u00ec\u00b2 \u00ed\u00ec\u00b8 \u00ed\u00ec"],
          riskFlags: ["\u00ec\u00ad \u00ec \u00ed\u00b8 \u00ed\u00ec\u00b8 \u00ed\u00ec"],
          createdAt: "2026-04-27T08:52:00.000Z",
          updatedAt: "2026-04-27T08:56:00.000Z"
        }
      ]
    },
    approvalGate: {
      approvalRequired: true,
      externalActionAllowed: false,
      reasonCodes: ["manual_approval_required", "risk_flags_present"]
    }
  };

  const safe = buildLawbotReviewSafeDto(raw);
  const safeJson = JSON.stringify(safe);
  safeAssert.equal(FORBIDDEN_MOJIBAKE_CHAR_PATTERN.test(safeJson), false);

  safeAssert.equal(safe.inquiryId, "cmof24jza0000l704mik5cy3x");
  safeAssert.equal(safe.approvalGate.approvalRequired, true);
  safeAssert.equal(safe.approvalGate.externalActionAllowed, false);
  safeAssert.equal(safe.reviewSignals.mustVerifyCount, 1);
  safeAssert.equal(safe.reviewSignals.mustVerifySourcesCount, 2);
  safeAssert.equal(safe.reviewSignals.riskFlagsCount, 2);
  safeAssert.equal(safe.reviewSignals.sourceVerificationChecklist.totalRequired, 2);
  safeAssert.equal(safe.reviewQueue.totalDrafts, 2);
  safeAssert.equal(safe.reviewQueue.approvalPendingDrafts, 2);

  safeAssert.equal(safeJson.includes('"mustVerify":'), false);
  safeAssert.equal(safeJson.includes('"mustVerifySources":'), false);
  safeAssert.equal(safeJson.includes('"riskFlags":'), false);
  safeAssert.equal(safeJson.includes("ì"), false);
  safeAssert.equal(safeJson.includes("ë"), false);
  safeAssert.equal(safeJson.includes("í"), false);
  safeAssert.equal(safeJson.includes("Â"), false);
  safeAssert.equal(safeJson.includes("\u0085"), false);
  safeAssert.equal(safeJson.includes("\uFFFD"), false);

  safeAssert.equal("mustVerifySources" in safe.reviewQueue.documentDrafts[0], false);
  safeAssert.equal("riskFlags" in safe.reviewQueue.documentDrafts[0], false);
  safeAssert.equal("mustVerifySources" in safe.reviewQueue.messageDrafts[0], false);
  safeAssert.equal("riskFlags" in safe.reviewQueue.messageDrafts[0], false);

  console.log("lawbot-bridge-review-safe-dto-test-ok");
}

runSafeDtoTest();
