const readinessUiAssert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  buildLawbotMessageSendReadinessUiModel
} = require("./lawbot-message-send-readiness-ui-model.ts");

function assertNoUnsafeOutput(value: unknown) {
  const serialized = JSON.stringify(value);
  readinessUiAssert.equal(serialized.includes('"mustVerify":'), false);
  readinessUiAssert.equal(serialized.includes('"mustVerifySources":'), false);
  readinessUiAssert.equal(serialized.includes('"riskFlags":'), false);
  readinessUiAssert.equal(serialized.includes("raw message body text"), false);
  readinessUiAssert.equal(serialized.includes("client@example.test"), false);
  readinessUiAssert.equal(/[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/.test(serialized), false);
}

function runLawbotMessageSendReadinessUiModelTest() {
  const raw = {
    inquiryId: "inq_ready",
    caseId: "case_ready",
    caseNumber: "CASE-READY-001",
    workflowStatus: "APPROVED",
    sendReadiness: {
      status: "DRY_RUN_READY",
      ready: true,
      dryRunOnly: false,
      externalActionAllowed: true,
      reasonCodes: ["DRY_RUN_READY"]
    },
    messageDrafts: [
      {
        id: "msg_ready",
        status: "APPROVED",
        reviewRequired: false,
        createdAt: "2026-05-03T10:00:00.000Z",
        updatedAt: "2026-05-03T10:05:00.000Z",
        readinessStatus: "DRY_RUN_READY",
        reasonCodes: ["DRY_RUN_READY"],
        bodyText: "raw message body text",
        recipient: "client@example.test",
        mustVerify: ["raw"],
        mustVerifySources: ["raw"],
        riskFlags: ["raw"]
      }
    ]
  };

  const model = buildLawbotMessageSendReadinessUiModel(raw);
  readinessUiAssert.ok(model);
  readinessUiAssert.equal(model.sendReadiness.status, "DRY_RUN_READY");
  readinessUiAssert.equal(model.sendReadiness.ready, true);
  readinessUiAssert.equal(model.sendReadiness.dryRunOnly, true);
  readinessUiAssert.equal(model.sendReadiness.externalActionAllowed, false);
  readinessUiAssert.equal(model.messageDrafts.length, 1);
  readinessUiAssert.equal(model.messageDrafts[0].readinessStatus, "DRY_RUN_READY");
  assertNoUnsafeOutput(model);

  const clientPath = path.resolve(
    __dirname,
    "..",
    "..",
    "components",
    "admin",
    "lawbot-review-readonly-client.tsx"
  );
  const clientSource = fs.readFileSync(clientPath, "utf8");
  readinessUiAssert.equal(clientSource.includes("메시지 발송 준비 상태"), true);
  readinessUiAssert.equal(clientSource.includes("Dry-run 점검"), true);
  readinessUiAssert.equal(clientSource.includes("외부 발송 허용"), true);
  readinessUiAssert.equal(clientSource.includes("이 패널은 발송 준비 상태만 점검합니다. 실제 발송은 실행하지 않습니다."), true);
  readinessUiAssert.equal(clientSource.includes("외부 발송은 별도 단계에서만 가능합니다."), true);
  readinessUiAssert.equal(clientSource.includes("message-send-readiness"), true);
  readinessUiAssert.equal(clientSource.includes("run-lawbot-" + "workflow"), false);
  readinessUiAssert.equal(clientSource.includes("client-message-service"), false);
  readinessUiAssert.equal(clientSource.includes("dispatchInitialClientMessage"), false);
  readinessUiAssert.equal(clientSource.includes("clientMessageAdapters"), false);
  readinessUiAssert.equal(clientSource.includes("sendInitialMessage"), false);
  readinessUiAssert.equal(clientSource.includes("externalActionAllowed: " + "true"), false);
  readinessUiAssert.equal(clientSource.includes('"mustVerify":'), false);
  readinessUiAssert.equal(clientSource.includes('"mustVerifySources":'), false);
  readinessUiAssert.equal(clientSource.includes('"riskFlags":'), false);
  readinessUiAssert.equal(/[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/.test(clientSource), false);

  console.log("lawbot-message-send-readiness-ui-model-test-ok");
}

runLawbotMessageSendReadinessUiModelTest();

export {};
