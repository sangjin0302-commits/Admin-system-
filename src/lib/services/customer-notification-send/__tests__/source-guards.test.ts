import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

async function testNoProviderAndNoMutationStrings() {
  const source = readFileSync(
    join(process.cwd(), "src/lib/services/customer-notification-send-service.ts"),
    "utf8"
  );

  const forbidden = [
    "dispatchInitialClientMessage",
    "client-message-service",
    "providerCalled: true",
    "send adapter"
  ];
  for (const fragment of forbidden) {
    assert.equal(
      source.includes(fragment),
      false,
      `Forbidden source fragment detected: ${fragment}`
    );
  }
}

function testNoForbiddenResponseFieldInRouteAndTemplateFiles() {
  const root = process.cwd();
  const sendServiceSource = readFileSync(
    join(root, "src/lib/services/customer-notification-send-service.ts"),
    "utf8"
  );
  const routeSource = readFileSync(
    join(root, "src/app/api/admin/inquiries/[id]/customer-notification/send/route.ts"),
    "utf8"
  );
  const combined = `${sendServiceSource}\n${routeSource}`;

  assert.equal(combined.includes("prisma.inquiry.updateMany"), false);
  assert.equal(combined.includes("prisma.inquiry.create"), false);
  assert.equal(combined.includes("prisma.inquiry.delete"), false);
}

async function run() {
  await testNoProviderAndNoMutationStrings();
  testNoForbiddenResponseFieldInRouteAndTemplateFiles();
  console.log("customer notification send source guards tests passed");
}

run().catch((error) => {
  throw error;
});
