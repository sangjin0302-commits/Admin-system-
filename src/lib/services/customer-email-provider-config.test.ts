import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildCustomerEmailProviderReadiness,
  parseCustomerEmailProviderConfig
} from "@/lib/services/customer-email-provider-config";

function testDefaultConfigFallsBackToDryRun() {
  const config = parseCustomerEmailProviderConfig({});

  assert.equal(config.provider, "dry-run");
  assert.equal(config.providerEnabled, false);
  assert.equal(config.realSendEnabled, false);
  assert.equal(config.realProviderCandidate, false);
  assert.equal(config.fallbackProvider, "dry-run");
  assert.equal(config.apiKeyConfigured, false);
  assert.equal(config.fromConfigured, false);
  assert.equal(config.allowedFromDomainConfigured, false);
  assert.equal(config.blockedReasonCodes.includes("EMAIL_PROVIDER_DRY_RUN_DEFAULT"), true);
  assert.equal(config.blockedReasonCodes.includes("EMAIL_PROVIDER_NOT_ENABLED"), true);
  assert.equal(config.blockedReasonCodes.includes("EMAIL_REAL_SEND_NOT_ENABLED"), true);

  const readiness = buildCustomerEmailProviderReadiness({});
  assert.equal(readiness.canSendRealEmail, false);
  assert.equal(readiness.canUseRealProvider, false);
  assert.equal(readiness.dryRunOnly, true);
  assert.equal(readiness.externalActionAllowed, false);
  assert.equal(readiness.providerImplementationStatus, "not_configured");
  assert.equal(readiness.blockedReasonCodes.includes("PROVIDER_DISABLED"), true);
  assert.equal(readiness.blockedReasonCodes.includes("REAL_SEND_DISABLED"), true);
}

function testResendMissingRequiredConfigFallsBackToDryRun() {
  const config = parseCustomerEmailProviderConfig({
    EMAIL_PROVIDER: "resend"
  });

  assert.equal(config.provider, "resend");
  assert.equal(config.realProviderCandidate, false);
  assert.equal(config.fallbackProvider, "dry-run");
  assert.equal(config.blockedReasonCodes.includes("RESEND_API_KEY_MISSING"), true);
  assert.equal(config.blockedReasonCodes.includes("EMAIL_FROM_MISSING"), true);
  assert.equal(config.blockedReasonCodes.includes("EMAIL_ALLOWED_FROM_DOMAIN_MISSING"), true);

  const readiness = buildCustomerEmailProviderReadiness({
    EMAIL_PROVIDER: "resend"
  });
  assert.equal(readiness.canSendRealEmail, false);
  assert.equal(readiness.hasApiKey, false);
  assert.equal(readiness.hasFromAddress, false);
  assert.equal(readiness.hasAllowedDomain, false);
  assert.equal(readiness.blockedReasonCodes.includes("API_KEY_MISSING"), true);
  assert.equal(readiness.blockedReasonCodes.includes("FROM_ADDRESS_MISSING"), true);
  assert.equal(readiness.blockedReasonCodes.includes("ALLOWED_DOMAIN_MISSING"), true);
}

function testResendProviderEnabledButRealSendDisabledFallsBackToDryRun() {
  const config = parseCustomerEmailProviderConfig({
    EMAIL_PROVIDER: "resend",
    EMAIL_PROVIDER_ENABLED: "true",
    EMAIL_REAL_SEND_ENABLED: "false",
    RESEND_API_KEY: "configured",
    EMAIL_FROM: "Notice <notice@example.com>",
    EMAIL_ALLOWED_FROM_DOMAIN: "example.com"
  });

  assert.equal(config.providerEnabled, true);
  assert.equal(config.realSendEnabled, false);
  assert.equal(config.realProviderCandidate, false);
  assert.equal(config.blockedReasonCodes.includes("EMAIL_REAL_SEND_NOT_ENABLED"), true);

  const readiness = buildCustomerEmailProviderReadiness({
    EMAIL_PROVIDER: "resend",
    EMAIL_PROVIDER_ENABLED: "true",
    EMAIL_REAL_SEND_ENABLED: "false",
    RESEND_API_KEY: "configured",
    EMAIL_FROM: "Notice <notice@example.com>",
    EMAIL_ALLOWED_FROM_DOMAIN: "example.com"
  });
  assert.equal(readiness.hasApiKey, true);
  assert.equal(readiness.hasFromAddress, true);
  assert.equal(readiness.hasAllowedDomain, true);
  assert.equal(readiness.fromDomainAllowed, true);
  assert.equal(readiness.canSendRealEmail, false);
  assert.equal(readiness.blockedReasonCodes.includes("REAL_SEND_DISABLED"), true);
}

function testFromDomainMismatchBlocksRealProviderCandidate() {
  const config = parseCustomerEmailProviderConfig({
    EMAIL_PROVIDER: "resend",
    EMAIL_PROVIDER_ENABLED: "true",
    EMAIL_REAL_SEND_ENABLED: "true",
    RESEND_API_KEY: "configured",
    EMAIL_FROM: "notice@not-allowed.example",
    EMAIL_ALLOWED_FROM_DOMAIN: "example.com",
    EMAIL_REPLY_TO: "office@example.com",
    EMAIL_SEND_MAX_PER_INQUIRY_PER_CHANNEL: "3",
    EMAIL_WEBHOOK_ENABLED: "true",
    EMAIL_PROVIDER_WEBHOOK_SECRET: "configured"
  });

  assert.equal(config.provider, "resend");
  assert.equal(config.apiKeyConfigured, true);
  assert.equal(config.fromConfigured, true);
  assert.equal(config.replyToConfigured, true);
  assert.equal(config.webhookEnabled, true);
  assert.equal(config.sendMaxPerInquiryPerChannel, 3);
  assert.equal(config.fromDomainMatchesAllowedDomain, false);
  assert.equal(config.realProviderCandidate, false);
  assert.equal(config.blockedReasonCodes.includes("EMAIL_FROM_DOMAIN_NOT_ALLOWED"), true);

  const readiness = buildCustomerEmailProviderReadiness({
    EMAIL_PROVIDER: "resend",
    EMAIL_PROVIDER_ENABLED: "true",
    EMAIL_REAL_SEND_ENABLED: "true",
    RESEND_API_KEY: "configured",
    EMAIL_FROM: "notice@not-allowed.example",
    EMAIL_ALLOWED_FROM_DOMAIN: "example.com",
    EMAIL_REPLY_TO: "office@example.com"
  });
  assert.equal(readiness.hasApiKey, true);
  assert.equal(readiness.hasFromAddress, true);
  assert.equal(readiness.hasReplyTo, true);
  assert.equal(readiness.hasAllowedDomain, true);
  assert.equal(readiness.fromDomainAllowed, false);
  assert.equal(readiness.canSendRealEmail, false);
  assert.equal(readiness.blockedReasonCodes.includes("FROM_DOMAIN_NOT_ALLOWED"), true);

  const serialized = JSON.stringify(config);
  assert.equal(serialized.includes("configured"), false);
  assert.equal(serialized.includes("notice@not-allowed.example"), false);
  assert.equal(serialized.includes("office@example.com"), false);
  const readinessSerialized = JSON.stringify(readiness);
  assert.equal(readinessSerialized.includes("configured"), false);
  assert.equal(readinessSerialized.includes("notice@not-allowed.example"), false);
  assert.equal(readinessSerialized.includes("office@example.com"), false);
}

function testFullyEnabledConfigStillReportsProviderNotImplemented() {
  const config = parseCustomerEmailProviderConfig({
    EMAIL_PROVIDER: "resend",
    EMAIL_PROVIDER_ENABLED: "true",
    EMAIL_REAL_SEND_ENABLED: "true",
    RESEND_API_KEY: "configured",
    EMAIL_FROM: "notice@example.com",
    EMAIL_ALLOWED_FROM_DOMAIN: "example.com"
  });

  assert.equal(config.realProviderCandidate, true);
  assert.equal(config.fallbackProvider, "dry-run");
  assert.equal(config.blockedReasonCodes.includes("REAL_RESEND_PROVIDER_NOT_IMPLEMENTED"), true);

  const readiness = buildCustomerEmailProviderReadiness({
    EMAIL_PROVIDER: "resend",
    EMAIL_PROVIDER_ENABLED: "true",
    EMAIL_REAL_SEND_ENABLED: "true",
    RESEND_API_KEY: "configured",
    EMAIL_FROM: "notice@example.com",
    EMAIL_ALLOWED_FROM_DOMAIN: "example.com"
  });
  assert.equal(readiness.providerImplementationStatus, "stub_only");
  assert.equal(readiness.canUseRealProvider, false);
  assert.equal(readiness.canSendRealEmail, false);
  assert.equal(readiness.blockedReasonCodes.includes("PROVIDER_IMPLEMENTATION_STUB_ONLY"), true);
}

function testSourceGuardrails() {
  const source = readFileSync(
    join(process.cwd(), "src/lib/services/customer-email-provider-config.ts"),
    "utf8"
  );

  for (const forbidden of [
    "process.env",
    "fetch(",
    "new Resend",
    "resend.emails.send",
    "sendgrid",
    "@aws-sdk/client-ses",
    "nodemailer",
    "client-message-service",
    "dispatchInitialClientMessage"
  ]) {
    assert.equal(source.includes(forbidden), false, `Forbidden source fragment: ${forbidden}`);
  }
}

testDefaultConfigFallsBackToDryRun();
testResendMissingRequiredConfigFallsBackToDryRun();
testResendProviderEnabledButRealSendDisabledFallsBackToDryRun();
testFromDomainMismatchBlocksRealProviderCandidate();
testFullyEnabledConfigStillReportsProviderNotImplemented();
testSourceGuardrails();

console.log("customer email provider config tests passed");
