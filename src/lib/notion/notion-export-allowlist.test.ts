import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  assertNoNotionForbiddenFields,
  buildCaseMatterNotionSafeSummaryPayload,
  buildNotionExportIdempotencyKey,
  getNotionExportForbiddenFieldLabels,
  hashNotionExportIdempotencyKey,
  NOTION_CASE_MANAGEMENT_MAPPING_DRAFT,
  NOTION_CASE_MATTER_SAFE_EXPORT_FIELDS,
  NOTION_GLOBAL_FORBIDDEN_EXPORT_FIELDS,
  NotionForbiddenFieldError,
  redactNotionExportIdempotencyKey,
  scanNotionExportForbiddenFields
} from "./notion-export-allowlist";

assert.deepEqual(NOTION_CASE_MATTER_SAFE_EXPORT_FIELDS, [
  "caseNo",
  "title",
  "matterTypeLabel",
  "status",
  "dueDate",
  "assignedTo",
  "safeSummary",
  "createdAt",
  "updatedAt",
  "sourceTrackingCode",
  "adminCaseUrl"
]);

for (const forbiddenField of [
  "phone",
  "email",
  "internalMemo",
  "communicationLogs",
  "rawPayload",
  "feeAmount",
  "paidAmount",
  "paymentMemo",
  "token",
  "privateDriveLink",
  "actualFilePath"
] as const) {
  assert.equal(NOTION_GLOBAL_FORBIDDEN_EXPORT_FIELDS.includes(forbiddenField), true);
}

assert.equal(getNotionExportForbiddenFieldLabels().internalMemo, "internal memo");

const topLevelScan = scanNotionExportForbiddenFields({
  caseNo: "20260602-QA-001",
  phone: "010-0000-0000",
  internalMemo: "do not expose"
});
assert.deepEqual(topLevelScan, {
  ok: false,
  forbiddenKeys: ["phone", "internalMemo"],
  errorCode: "NOTION_FORBIDDEN_FIELD_BLOCKED"
});
assert.equal(JSON.stringify(topLevelScan).includes("010-0000-0000"), false);
assert.equal(JSON.stringify(topLevelScan).includes("do not expose"), false);

const nestedScan = scanNotionExportForbiddenFields({
  fields: {
    title: "safe",
    meta: {
      communicationLogs: ["sensitive"],
      rawPayload: {
        secret: "hidden"
      }
    }
  }
});
assert.equal(nestedScan.ok, false);
if (!nestedScan.ok) {
  assert.deepEqual(nestedScan.forbiddenKeys, ["communicationLogs", "rawPayload", "secret"]);
}
assert.equal(JSON.stringify(nestedScan).includes("sensitive"), false);
assert.equal(JSON.stringify(nestedScan).includes("hidden"), false);

assert.doesNotThrow(() => assertNoNotionForbiddenFields({ fields: { caseNo: "QA", title: "safe" } }));
assert.throws(
  () => assertNoNotionForbiddenFields({ fields: { email: "qa@example.test" } }),
  (error) => error instanceof NotionForbiddenFieldError && error.forbiddenKeys.includes("email")
);

const safePayload = buildCaseMatterNotionSafeSummaryPayload({
  id: "case_1",
  caseNo: "20260602-QA-001",
  title: "QA NON_CUSTOMER safe case",
  matterType: "immigration",
  matterTypeLabel: null,
  status: "collecting_documents",
  dueDate: new Date("2026-06-30T00:00:00.000Z"),
  assignedTo: "Admin",
  createdAt: "2026-06-02",
  updatedAt: "",
  sourceTrackingCode: null,
  safeSummary: "Safe operational summary only.",
  adminCaseUrl: "/admin/cases/case_1"
});
assert.equal(safePayload.entityType, "case_matter");
assert.deepEqual(safePayload.fields, {
  caseNo: "20260602-QA-001",
  title: "QA NON_CUSTOMER safe case",
  matterTypeLabel: "immigration",
  status: "collecting_documents",
  dueDate: "2026-06-30T00:00:00.000Z",
  assignedTo: "Admin",
  safeSummary: "Safe operational summary only.",
  createdAt: "2026-06-02",
  adminCaseUrl: "/admin/cases/case_1"
});
assert.equal("phone" in safePayload.fields, false);
assert.equal("internalMemo" in safePayload.fields, false);
assert.equal("feeAmount" in safePayload.fields, false);

const unknownPayload = buildCaseMatterNotionSafeSummaryPayload({
  id: "case_2",
  title: "Unknown matter type case"
});
assert.equal(unknownPayload.fields.matterTypeLabel, "unknown");
assert.equal(unknownPayload.fields.caseNo, undefined);

const key = buildNotionExportIdempotencyKey({
  entityType: "case_matter",
  entityId: "case_1",
  destination: "notion.case_management"
});
assert.equal(key, "adminSystem:CaseMatter:case_1:notion.case_management");
assert.match(hashNotionExportIdempotencyKey(key), /^[a-f0-9]{64}$/);
assert.match(redactNotionExportIdempotencyKey(key), /^sha256:[a-f0-9]{12}$/);
assert.equal(redactNotionExportIdempotencyKey(key).includes("case_1"), false);

assert.deepEqual(NOTION_CASE_MANAGEMENT_MAPPING_DRAFT.properties, {
  title: "사건명",
  caseNo: "사건번호",
  matterTypeLabel: "업무분야",
  status: "진행상태",
  dueDate: "제출기한",
  assignedTo: "담당자",
  safeSummary: "다음 액션"
});

const allowlistSource = readFileSync("src/lib/notion/notion-export-allowlist.ts", "utf8");
assert.equal(allowlistSource.includes("@notionhq/client"), false);
assert.equal(allowlistSource.includes("fetch("), false);
assert.equal(allowlistSource.includes("process.env"), false);
