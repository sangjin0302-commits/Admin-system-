import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { POST } from "@/app/api/public/track/route";

function jsonRequest(body: unknown) {
  return new Request("https://example.test/api/public/track", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function main() {
  const missingTrackingCode = await POST(jsonRequest({ phoneLast4: "1234" }));
  assert.equal(missingTrackingCode.status, 400);

  const invalidPhone = await POST(
    jsonRequest({
      trackingCode: "20260504-VI-0001-K3",
      phoneLast4: "12"
    })
  );
  assert.equal(invalidPhone.status, 400);

  const invalidJson = await POST(
    new Request("https://example.test/api/public/track", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: "{"
    })
  );
  assert.equal(invalidJson.status, 400);

  const source = readFileSync(
    join(process.cwd(), "src/app/api/public/track/route.ts"),
    "utf8"
  );
  assert.match(source, /export async function POST/);
  assert.equal(/client-message-service|sendAdapter|submitAdapter|run-lawbot-workflow/.test(source), false);
  assert.equal(/prisma\.(inquiry|caseRecord)\.(create|update|delete|upsert)/.test(source), false);
  assert.equal(source.includes("requestId"), false);
}

main().catch((error) => {
  throw error;
});
