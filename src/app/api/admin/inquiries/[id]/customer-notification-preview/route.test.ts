import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { GET } from "@/app/api/admin/inquiries/[id]/customer-notification-preview/route";

async function testInvalidChannelReturns400() {
  const response = await GET(
    new Request("https://example.test/api/admin/inquiries/inq_123/customer-notification-preview?channel=fax"),
    {
      params: Promise.resolve({ id: "inq_123" })
    }
  );
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "CHANNEL_NOT_SUPPORTED");
}

async function testInvalidInquiryIdReturns400() {
  const response = await GET(
    new Request("https://example.test/api/admin/inquiries/bad id/customer-notification-preview"),
    {
      params: Promise.resolve({ id: "bad id" })
    }
  );
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.code, "INVALID_INQUIRY_ID");
}

function testRouteSourceGuardrails() {
  const routeSource = readFileSync(
    join(
      process.cwd(),
      "src/app/api/admin/inquiries/[id]/customer-notification-preview/route.ts"
    ),
    "utf8"
  );

  assert.match(routeSource, /export async function GET/);
  assert.equal(routeSource.includes("POST("), false);
  assert.equal(routeSource.includes("client-message-service"), false);
  assert.equal(routeSource.includes("dispatchInitialClientMessage"), false);
  assert.equal(routeSource.includes("appendInquiryCommunicationLog"), false);
  assert.equal(routeSource.includes("externalActionAllowed: true"), false);
}

async function run() {
  await testInvalidChannelReturns400();
  await testInvalidInquiryIdReturns400();
  testRouteSourceGuardrails();
  console.log("customer notification preview route tests passed");
}

run().catch((error) => {
  throw error;
});
