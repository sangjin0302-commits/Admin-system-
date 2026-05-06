import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildDisabledResendCustomerEmailProviderResult,
  createDisabledResendCustomerEmailProvider,
  CUSTOMER_EMAIL_PROVIDER_RESEND_STUB_NAME
} from "@/lib/services/customer-email-resend-provider";

function createValidInput() {
  return {
    to: "customer@example.com",
    from: "notice@example.com",
    replyTo: "reply@example.com",
    subject: "Tracking notice",
    text: "Tracking code and /track link only.",
    html: "<p>Tracking code and /track link only.</p>",
    idempotencyKey: "resend-stub-test"
  };
}

async function testDisabledResult() {
  const result = buildDisabledResendCustomerEmailProviderResult();
  assert.equal(result.providerName, CUSTOMER_EMAIL_PROVIDER_RESEND_STUB_NAME);
  assert.equal(result.providerCalled, false);
  assert.equal(result.dryRunOnly, true);
  assert.equal(result.externalActionAllowed, false);
  assert.equal(result.status, "FAILED");
  assert.equal(result.failureReasonCode, "PROVIDER_IMPLEMENTATION_STUB_ONLY");
  assert.equal(result.messageId, undefined);
}

async function testStubNeverSends() {
  const provider = createDisabledResendCustomerEmailProvider();
  const result = await provider.sendEmail(createValidInput());

  assert.equal(result.providerName, "resend-disabled");
  assert.equal(result.providerCalled, false);
  assert.equal(result.dryRunOnly, true);
  assert.equal(result.externalActionAllowed, false);
  assert.notEqual(result.status, "SENT");
  assert.equal(result.failureReasonCode, "PROVIDER_IMPLEMENTATION_STUB_ONLY");
}

function testSourceGuardrails() {
  const source = readFileSync(
    join(process.cwd(), "src/lib/services/customer-email-resend-provider.ts"),
    "utf8"
  );

  for (const forbidden of [
    "new Resend",
    "resend.emails.send",
    "@sendgrid",
    "@aws-sdk/client-ses",
    "nodemailer",
    "createTransport",
    "fetch(",
    "providerCalled: true",
    "externalActionAllowed: true",
    "status: \"SENT\"",
    "client-message-service",
    "dispatchInitialClientMessage"
  ]) {
    assert.equal(source.includes(forbidden), false, `Forbidden source fragment: ${forbidden}`);
  }
}

async function run() {
  await testDisabledResult();
  await testStubNeverSends();
  testSourceGuardrails();

  console.log("customer email resend provider tests passed");
}

run().catch((error) => {
  throw error;
});
