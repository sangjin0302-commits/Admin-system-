const readinessUiAssert = require("node:assert/strict");

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
  readinessUiAssert.equal(/[ìëíÂ\uFFFD]/.test(serialized), false);
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

  // 추가 안전 케이스: externalActionAllowed=true 입력이 들어와도 모델이 강제로
  // dryRunOnly 로 낮추고 민감필드(mustVerify/riskFlags/원문)를 노출 안 함을 검증.
  // (기존엔 client 컴포넌트 소스를 grep 했으나 리팩터마다 깨져 모델 단위검증으로 대체.)
  const externalModel = buildLawbotMessageSendReadinessUiModel({
    inquiryId: "inq_ext",
    caseId: "case_ext",
    caseNumber: "CASE-EXT-002",
    workflowStatus: "APPROVED",
    sendReadiness: {
      status: "EXTERNAL_BLOCKED",
      ready: false,
      dryRunOnly: false,
      externalActionAllowed: true,
      reasonCodes: ["EXTERNAL_BLOCKED"]
    },
    messageDrafts: [
      {
        id: "msg_ext",
        status: "PENDING",
        reviewRequired: true,
        createdAt: "2026-05-04T10:00:00.000Z",
        updatedAt: "2026-05-04T10:05:00.000Z",
        readinessStatus: "EXTERNAL_BLOCKED",
        reasonCodes: ["EXTERNAL_BLOCKED"],
        bodyText: "raw message body text",
        recipient: "client@example.test",
        mustVerify: ["raw"],
        mustVerifySources: ["raw"],
        riskFlags: ["raw"]
      }
    ]
  });
  readinessUiAssert.equal(externalModel.sendReadiness.externalActionAllowed, false);
  readinessUiAssert.equal(externalModel.sendReadiness.dryRunOnly, true);
  assertNoUnsafeOutput(externalModel);

  console.log("lawbot-message-send-readiness-ui-model-test-ok");
}

runLawbotMessageSendReadinessUiModelTest();

export {};
