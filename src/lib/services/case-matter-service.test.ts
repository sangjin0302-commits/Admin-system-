import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { updateRequiredDocumentMetadataSchema } from "@/lib/validation/case-matter";

const root = process.cwd();
const serviceSource = readFileSync(join(root, "src/lib/services/case-matter-service.ts"), "utf8");
const routeSource = readFileSync(
  join(root, "src/app/api/admin/case-matters/[id]/required-documents/[documentId]/route.ts"),
  "utf8"
);
const panelSource = readFileSync(
  join(root, "src/components/admin/required-document-status-panel.tsx"),
  "utf8"
);

const parsed = updateRequiredDocumentMetadataSchema.parse({
  name: "  Updated passport copy  ",
  description: "",
  required: false,
  dueDate: "",
  actorName: "QA",
  expectedUpdatedAt: "2026-05-12T00:00:00.000Z",
  expectedCaseUpdatedAt: "2026-05-12T00:00:00.000Z"
});

assert.equal(parsed.name, "Updated passport copy");
assert.equal(parsed.description, "");
assert.equal(parsed.required, false);
assert.equal(parsed.dueDate, "");

assert.throws(() =>
  updateRequiredDocumentMetadataSchema.parse({
    name: "",
    required: true
  })
);

assert.throws(() =>
  updateRequiredDocumentMetadataSchema.parse({
    name: "Valid document",
    required: true,
    dueDate: "not-a-date"
  })
);

assert.match(serviceSource, /export async function updateRequiredDocumentMetadata/);
assert.match(serviceSource, /REQUIRED_DOCUMENT_METADATA_UPDATED/);
assert.match(serviceSource, /REQUIRED_DOCUMENT_DUPLICATE/);
assert.match(serviceSource, /expectedUpdatedAt/);
assert.match(serviceSource, /expectedCaseUpdatedAt/);
assert.match(serviceSource, /payloadJson: JSON\.stringify/);
assert.doesNotMatch(serviceSource, /communicationLogs|ADMIN_BASIC_AUTH_PASSWORD|RESEND_API_KEY|EMAIL_FROM/);

assert.match(routeSource, /export async function PATCH/);
assert.match(routeSource, /updateRequiredDocumentMetadataSchema/);
assert.match(routeSource, /updateRequiredDocumentMetadata/);
assert.match(routeSource, /CONCURRENT_UPDATE_CONFLICT/);
assert.doesNotMatch(routeSource, /caseMatter\s*:/);

assert.match(panelSource, /submitMetadata/);
assert.match(panelSource, /method: "PATCH"/);
assert.match(panelSource, /expectedUpdatedAt: snapshot\.updatedAt/);
assert.match(panelSource, /expectedCaseUpdatedAt: caseMatterUpdatedAt/);
assert.match(panelSource, /type="date"/);
assert.doesNotMatch(panelSource, /communicationLogs|internalMemo|payloadJson|ADMIN_BASIC_AUTH_PASSWORD/);

console.log("case matter service metadata tests passed");
