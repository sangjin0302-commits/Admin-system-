import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { POST } from "@/app/api/admin/inquiries/[id]/customer-notification/send/route";

async function testInvalidInquiryIdReturns400() {
  const response = await POST(
    new Request("https://example.test/api/admin/inquiries/bad id/customer-notification/send", {
      method: "POST",
      body: JSON.stringify({ channel: "manual", previewHash: "hash", messageVersion: "v", idempotencyKey: "key", confirmations: {} })
    }),
    {
      params: Promise.resolve({ id: "bad id" })
    }
  );
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "INVALID_INQUIRY_ID");
}

async function testSmsChannelReturns400() {
  const response = await POST(
    new Request("https://example.test/api/admin/inquiries/inq_123/customer-notification/send", {
      method: "POST",
      body: JSON.stringify({ channel: "sms", previewHash: "hash", messageVersion: "tracking-notice-v1", idempotencyKey: "key", confirmations: {} })
    }),
    {
      params: Promise.resolve({ id: "inq_123" })
    }
  );
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "CHANNEL_SEND_NOT_ENABLED");
}

async function testEmailMissingRequiredFieldsReturns400() {
  const response = await POST(
    new Request("https://example.test/api/admin/inquiries/inq_123/customer-notification/send", {
      method: "POST",
      body: JSON.stringify({
        channel: "email",
        previewHash: "",
        messageVersion: "tracking-notice-v1",
        idempotencyKey: "key",
        confirmations: {}
      })
    }),
    {
      params: Promise.resolve({ id: "inq_123" })
    }
  );
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "VALIDATION_ERROR");
}

async function testManualMissingRequiredFieldsReturns400() {
  const response = await POST(
    new Request("https://example.test/api/admin/inquiries/inq_123/customer-notification/send", {
      method: "POST",
      body: JSON.stringify({
        channel: "manual",
        previewHash: "",
        messageVersion: "tracking-notice-v1",
        idempotencyKey: "key",
        confirmations: {}
      })
    }),
    {
      params: Promise.resolve({ id: "inq_123" })
    }
  );
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "VALIDATION_ERROR");
}

async function testManualMissingConfirmationsReturns400() {
  const response = await POST(
    new Request("https://example.test/api/admin/inquiries/inq_123/customer-notification/send", {
      method: "POST",
      body: JSON.stringify({
        channel: "manual",
        previewHash: "hash",
        messageVersion: "tracking-notice-v1",
        idempotencyKey: "key",
        confirmations: {
          recipientConfirmed: true,
          trackingCodeConfirmed: true,
          messageContentReviewed: true,
          noSensitiveInternalDataConfirmed: true,
          customerConsentConfirmed: true
        }
      })
    }),
    {
      params: Promise.resolve({ id: "inq_123" })
    }
  );
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "VALIDATION_ERROR");
}

async function testManualMissingIdempotencyReasonWhitespaceReturns400() {
  const response = await POST(
    new Request("https://example.test/api/admin/inquiries/inq_123/customer-notification/send", {
      method: "POST",
      body: JSON.stringify({
        channel: "manual",
        previewHash: "hash",
        messageVersion: "tracking-notice-v1",
        idempotencyKey: "   ",
        confirmations: {
          recipientConfirmed: true,
          trackingCodeConfirmed: true,
          messageContentReviewed: true,
          noSensitiveInternalDataConfirmed: true,
          customerConsentConfirmed: true,
          finalSendConfirmed: true
        }
      })
    }),
    {
      params: Promise.resolve({ id: "inq_123" })
    }
  );
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "VALIDATION_ERROR");
}

async function testInvalidJsonReturns400() {
  const response = await POST(
    new Request("https://example.test/api/admin/inquiries/inq_123/customer-notification/send", {
      method: "POST",
      body: "not-json"
    }),
    {
      params: Promise.resolve({ id: "inq_123" })
    }
  );
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "VALIDATION_ERROR");
}

function testRouteSourceGuardrails() {
  const routeSource = readFileSync(
    join(
      process.cwd(),
      "src/app/api/admin/inquiries/[id]/customer-notification/send/route.ts"
    ),
    "utf8"
  );

  assert.match(routeSource, /export async function POST/);
  assert.equal(routeSource.includes("client-message-service"), false);
  assert.equal(routeSource.includes("dispatchInitialClientMessage"), false);
  assert.equal(routeSource.includes("provider"), false);
  assert.equal(routeSource.includes("appendInquiryCommunicationLog"), false);
}

async function run() {
  await testInvalidInquiryIdReturns400();
  await testSmsChannelReturns400();
  await testEmailMissingRequiredFieldsReturns400();
  await testManualMissingRequiredFieldsReturns400();
  await testManualMissingConfirmationsReturns400();
  await testManualMissingIdempotencyReasonWhitespaceReturns400();
  await testInvalidJsonReturns400();
  testRouteSourceGuardrails();
  console.log("customer notification send route tests passed");
}

run().catch((error) => {
  throw error;
});
