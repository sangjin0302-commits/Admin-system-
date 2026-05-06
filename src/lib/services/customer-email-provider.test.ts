import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildCustomerTrackingEmailMessage,
  createDryRunCustomerEmailProvider,
  CUSTOMER_EMAIL_MESSAGE_VERSION,
  CUSTOMER_EMAIL_PROVIDER_DRY_RUN_NAME,
  CustomerEmailProviderValidationError,
  getCustomerEmailProvider,
  isValidCustomerEmailAddress,
  normalizeCustomerEmailAddress,
  validateCustomerEmailProviderInput
} from "@/lib/services/customer-email-provider";

const trackingCode = "20260505-FC-0003-NM";
const trackUrl = "https://adminofficemvp2.vercel.app/track";

function createValidInput(overrides?: Partial<Parameters<typeof validateCustomerEmailProviderInput>[0]>) {
  return {
    to: "customer@example.com",
    from: "notice@example.com",
    replyTo: "reply@example.com",
    subject: "접수 진행상황 확인 안내",
    text: "접수번호와 진행상황 확인 링크를 안내합니다.",
    html: "<p>접수번호와 진행상황 확인 링크를 안내합니다.</p>",
    idempotencyKey: "email-dry-run-001",
    metadata: {
      messageVersion: CUSTOMER_EMAIL_MESSAGE_VERSION
    },
    ...overrides
  };
}

function assertNoForbiddenFields(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    "inquiryId",
    "caseId",
    "workflowStatus",
    "bridgeWorkflowStatus",
    "Lawbot",
    "approvalGate",
    "reviewSignals",
    "documentDrafts",
    "messageDrafts",
    "communicationLogs",
    "adminNote",
    "internal DB id",
    "vercel.app/admin",
    "href=\"/admin\""
  ]) {
    assert.equal(serialized.includes(forbidden), false, `Forbidden field leaked: ${forbidden}`);
  }
}

async function testDryRunProviderResult() {
  const provider = createDryRunCustomerEmailProvider();
  const result = await provider.sendEmail(createValidInput());

  assert.equal(result.providerName, CUSTOMER_EMAIL_PROVIDER_DRY_RUN_NAME);
  assert.equal(result.providerCalled, false);
  assert.equal(result.dryRunOnly, true);
  assert.equal(result.externalActionAllowed, false);
  assert.equal(result.status, "DRY_RUN_ACCEPTED");
  assert.equal(result.messageId, undefined);
  assert.equal(result.failureReasonCode, undefined);
  assertNoForbiddenFields(result);
}

function testEmailValidation() {
  assert.equal(normalizeCustomerEmailAddress(" USER@Example.COM "), "user@example.com");
  assert.equal(normalizeCustomerEmailAddress("   "), null);
  assert.equal(isValidCustomerEmailAddress("customer@example.com"), true);
  assert.equal(isValidCustomerEmailAddress("bad-address"), false);

  validateCustomerEmailProviderInput(createValidInput());

  assert.throws(
    () => validateCustomerEmailProviderInput(createValidInput({ to: "bad-address" })),
    (error: unknown) =>
      error instanceof CustomerEmailProviderValidationError &&
      error.code === "INVALID_RECIPIENT_EMAIL"
  );

  assert.throws(
    () => validateCustomerEmailProviderInput(createValidInput({ idempotencyKey: "" })),
    (error: unknown) =>
      error instanceof CustomerEmailProviderValidationError &&
      error.code === "IDEMPOTENCY_KEY_MISSING"
  );

  assert.throws(
    () => validateCustomerEmailProviderInput(createValidInput({ subject: " " })),
    (error: unknown) =>
      error instanceof CustomerEmailProviderValidationError &&
      error.code === "EMAIL_SUBJECT_MISSING"
  );

  assert.throws(
    () => validateCustomerEmailProviderInput(createValidInput({ text: "" })),
    (error: unknown) =>
      error instanceof CustomerEmailProviderValidationError &&
      error.code === "EMAIL_BODY_MISSING"
  );
}

function testMessageBuilderSafety() {
  const message = buildCustomerTrackingEmailMessage({
    trackingCode: " 20260505-fc-0003-nm ",
    officeName: "행정사 사무소",
    trackUrl
  });

  assert.equal(message.subject, "접수 진행상황 확인 안내");
  assert.equal(message.messageVersion, CUSTOMER_EMAIL_MESSAGE_VERSION);
  assert.equal(message.text.includes(trackingCode), true);
  assert.equal(message.text.includes(trackUrl), true);
  assert.equal(message.text.includes("휴대폰 번호 뒤 4자리"), true);
  assert.equal(message.text.includes("홈 화면"), true);
  assert.equal(message.html.includes(trackingCode), true);
  assert.equal(message.html.includes(trackUrl), true);
  assertNoForbiddenFields(message);

  assert.throws(
    () => buildCustomerTrackingEmailMessage({ trackingCode: " " }),
    (error: unknown) =>
      error instanceof CustomerEmailProviderValidationError &&
      error.code === "TRACKING_CODE_MISSING"
  );
}

async function testFactoryReturnsDryRunOnly() {
  const provider = getCustomerEmailProvider();
  const result = await provider.sendEmail(createValidInput({ idempotencyKey: "factory-check" }));
  assert.equal(result.providerName, CUSTOMER_EMAIL_PROVIDER_DRY_RUN_NAME);
  assert.equal(result.providerCalled, false);
  assert.equal(result.dryRunOnly, true);
  assert.equal(result.externalActionAllowed, false);
  assert.equal(result.status, "DRY_RUN_ACCEPTED");
}

async function testFactoryDoesNotReturnRealProviderForResendConfig() {
  const incompleteProvider = getCustomerEmailProvider({
    EMAIL_PROVIDER: "resend",
    EMAIL_PROVIDER_ENABLED: "true",
    EMAIL_REAL_SEND_ENABLED: "false",
    RESEND_API_KEY: "configured",
    EMAIL_FROM: "notice@example.com",
    EMAIL_ALLOWED_FROM_DOMAIN: "example.com"
  });
  const incompleteResult = await incompleteProvider.sendEmail(
    createValidInput({ idempotencyKey: "factory-resend-incomplete" })
  );
  assert.equal(incompleteResult.providerName, CUSTOMER_EMAIL_PROVIDER_DRY_RUN_NAME);
  assert.equal(incompleteResult.providerCalled, false);
  assert.equal(incompleteResult.dryRunOnly, true);
  assert.equal(incompleteResult.externalActionAllowed, false);

  const enabledLikeProvider = getCustomerEmailProvider({
    EMAIL_PROVIDER: "resend",
    EMAIL_PROVIDER_ENABLED: "true",
    EMAIL_REAL_SEND_ENABLED: "true",
    RESEND_API_KEY: "configured",
    EMAIL_FROM: "notice@example.com",
    EMAIL_ALLOWED_FROM_DOMAIN: "example.com"
  });
  const enabledLikeResult = await enabledLikeProvider.sendEmail(
    createValidInput({ idempotencyKey: "factory-resend-enabled-like" })
  );
  assert.equal(enabledLikeResult.providerName, "resend-disabled");
  assert.equal(enabledLikeResult.providerCalled, false);
  assert.equal(enabledLikeResult.dryRunOnly, true);
  assert.equal(enabledLikeResult.externalActionAllowed, false);
  assert.notEqual(enabledLikeResult.status, "SENT");
  assert.equal(enabledLikeResult.failureReasonCode, "PROVIDER_IMPLEMENTATION_STUB_ONLY");
}

function testSourceGuardrails() {
  const source = readFileSync(
    join(process.cwd(), "src/lib/services/customer-email-provider.ts"),
    "utf8"
  );

  for (const forbidden of [
    "sendgrid",
    "@aws-sdk/client-ses",
    "nodemailer",
    "smtp",
    "fetch(",
    "client-message-service",
    "dispatchInitialClientMessage",
    "providerCalled: true",
    "externalActionAllowed: true",
    "process.env"
  ]) {
    assert.equal(
      source.toLowerCase().includes(forbidden.toLowerCase()),
      false,
      `Forbidden provider source fragment detected: ${forbidden}`
    );
  }
}

async function run() {
  await testDryRunProviderResult();
  testEmailValidation();
  testMessageBuilderSafety();
  await testFactoryReturnsDryRunOnly();
  await testFactoryDoesNotReturnRealProviderForResendConfig();
  testSourceGuardrails();

  console.log("customer email provider tests passed");
}

run().catch((error) => {
  throw error;
});
