import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildCaseMatterNotionSafeSummaryPayload } from "./notion-export-allowlist";
import { buildNotionExportDryRunResult } from "./notion-export-dry-run";

const safePayload = buildCaseMatterNotionSafeSummaryPayload({
  id: "case_1",
  caseNo: "20260602-QA-001",
  title: "QA NON_CUSTOMER safe case",
  matterTypeLabel: "출입국/비자",
  status: "서류 수집",
  dueDate: "2026-06-30",
  assignedTo: "Admin",
  createdAt: "2026-06-02",
  updatedAt: "2026-06-02",
  sourceTrackingCode: "TRK-QA-001",
  safeSummary: "Safe summary only."
});

const safeDryRun = buildNotionExportDryRunResult({
  entityType: "case_matter",
  entityId: "case_1",
  destination: "notion.case_management",
  payload: safePayload
});

assert.equal(safeDryRun.ok, true);
assert.equal(safeDryRun.destination, "notion.case_management");
assert.equal(safeDryRun.entityType, "case_matter");
assert.equal(safeDryRun.wouldWrite, false);
assert.equal(safeDryRun.idempotencyKeyHashPresent, true);
assert.match(safeDryRun.idempotencyKeyHash, /^[a-f0-9]{64}$/);
assert.equal(safeDryRun.idempotencyKeyHash.includes("case_1"), false);
assert.equal(safeDryRun.forbiddenFieldCheck.ok, true);
assert.deepEqual(safeDryRun.forbiddenFieldCheck.forbiddenKeys, []);
assert.deepEqual(safeDryRun.exportedFieldKeys, [
  "assignedTo",
  "caseNo",
  "createdAt",
  "dueDate",
  "matterTypeLabel",
  "safeSummary",
  "sourceTrackingCode",
  "status",
  "title",
  "updatedAt"
]);
assert.deepEqual(safeDryRun.missingOptionalFields, ["adminCaseUrl"]);
assert.equal(JSON.stringify(safeDryRun).includes("QA NON_CUSTOMER safe case"), false);
assert.equal(JSON.stringify(safeDryRun).includes("Safe summary only"), false);

const sparsePayload = buildCaseMatterNotionSafeSummaryPayload({
  id: "case_2",
  title: "Sparse safe case"
});
const sparseDryRun = buildNotionExportDryRunResult({
  entityType: "case_matter",
  entityId: "case_2",
  destination: "notion.case_management",
  payload: sparsePayload
});
assert.equal(sparseDryRun.ok, true);
assert.equal(sparseDryRun.wouldWrite, false);
assert.equal(sparseDryRun.missingOptionalFields.includes("caseNo"), true);
assert.equal(sparseDryRun.missingOptionalFields.includes("adminCaseUrl"), true);

const blockedDryRun = buildNotionExportDryRunResult({
  entityType: "case_matter",
  entityId: "case_3",
  destination: "notion.case_management",
  payload: {
    entityType: "case_matter",
    fields: {
      caseNo: "20260602-QA-003",
      title: "safe title",
      internalMemo: "sensitive memo",
      nested: {
        phone: "010-0000-0000"
      }
    }
  }
});

assert.equal(blockedDryRun.ok, false);
assert.equal(blockedDryRun.wouldWrite, false);
assert.equal(blockedDryRun.errorCode, "NOTION_FORBIDDEN_FIELD_BLOCKED");
assert.deepEqual(blockedDryRun.forbiddenFieldCheck, {
  ok: false,
  forbiddenKeys: ["phone", "internalMemo"]
});
assert.equal(JSON.stringify(blockedDryRun).includes("sensitive memo"), false);
assert.equal(JSON.stringify(blockedDryRun).includes("010-0000-0000"), false);
assert.equal(blockedDryRun.exportedFieldKeys.includes("internalMemo"), true);

const dryRunSource = readFileSync("src/lib/notion/notion-export-dry-run.ts", "utf8");
assert.equal(dryRunSource.includes("@notionhq/client"), false);
assert.equal(dryRunSource.includes("fetch("), false);
assert.equal(dryRunSource.includes("process.env"), false);
