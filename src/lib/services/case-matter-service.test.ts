import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  createCaseTaskSchema,
  updateCaseTaskSchema,
  updateRequiredDocumentMetadataSchema
} from "@/lib/validation/case-matter";

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
const taskPanelSource = readFileSync(
  join(root, "src/components/admin/case-task-management-panel.tsx"),
  "utf8"
);
const taskRouteSource = readFileSync(
  join(root, "src/app/api/admin/case-matters/[id]/tasks/route.ts"),
  "utf8"
);
const taskPatchRouteSource = readFileSync(
  join(root, "src/app/api/admin/case-matters/[id]/tasks/[taskId]/route.ts"),
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

const parsedTaskCreate = createCaseTaskSchema.parse({
  title: "  Prepare evidence packet  ",
  details: "",
  description: "",
  priority: "HIGH",
  dueDate: "",
  assignedTo: "QA",
  expectedCaseUpdatedAt: "2026-05-12T00:00:00.000Z"
});

assert.equal(parsedTaskCreate.title, "Prepare evidence packet");
assert.equal(parsedTaskCreate.status, "TODO");
assert.equal(parsedTaskCreate.priority, "HIGH");
assert.equal(parsedTaskCreate.dueDate, "");

assert.throws(() =>
  createCaseTaskSchema.parse({
    title: "",
    dueDate: "2026-05-12"
  })
);

assert.throws(() =>
  createCaseTaskSchema.parse({
    title: "Valid task",
    dueDate: "not-a-date"
  })
);

const parsedTaskMetadata = updateCaseTaskSchema.parse({
  mode: "metadata",
  title: "Updated task",
  details: "",
  description: "",
  priority: "URGENT",
  dueDate: null,
  assignedTo: "",
  expectedUpdatedAt: "2026-05-12T00:00:00.000Z"
});
assert.equal(parsedTaskMetadata.mode, "metadata");
assert.equal(parsedTaskMetadata.priority, "URGENT");

const parsedTaskStatus = updateCaseTaskSchema.parse({
  mode: "status",
  status: "DONE",
  statusChangeNote: "Complete",
  expectedUpdatedAt: "2026-05-12T00:00:00.000Z"
});
assert.equal(parsedTaskStatus.mode, "status");
assert.equal(parsedTaskStatus.status, "DONE");

assert.throws(() =>
  updateCaseTaskSchema.parse({
    mode: "status",
    status: "NOT_VALID"
  })
);

assert.match(serviceSource, /export async function createCaseTask/);
assert.match(serviceSource, /export async function updateCaseTaskMetadata/);
assert.match(serviceSource, /export async function updateCaseTaskStatus/);
assert.match(serviceSource, /CASE_TASK_CREATED/);
assert.match(serviceSource, /CASE_TASK_METADATA_UPDATED/);
assert.match(serviceSource, /CASE_TASK_STATUS_CHANGED/);
assert.match(serviceSource, /completedAt: input\.status === "DONE" \? now : null/);
assert.match(serviceSource, /CaseTaskConcurrentUpdateError/);
assert.match(serviceSource, /expectedCaseUpdatedAt/);

assert.match(taskRouteSource, /export async function POST/);
assert.match(taskRouteSource, /createCaseTaskSchema/);
assert.match(taskRouteSource, /createCaseTask/);
assert.match(taskRouteSource, /return api\.ok\(\{ ok: true \}\)/);
assert.doesNotMatch(taskRouteSource, /caseMatter\s*:|communicationLogs|internalMemo/);

assert.match(taskPatchRouteSource, /export async function PATCH/);
assert.match(taskPatchRouteSource, /updateCaseTaskSchema/);
assert.match(taskPatchRouteSource, /updateCaseTaskMetadata/);
assert.match(taskPatchRouteSource, /updateCaseTaskStatus/);
assert.match(taskPatchRouteSource, /mode === "metadata"/);
assert.match(taskPatchRouteSource, /return api\.ok\(\{ ok: true \}\)/);
assert.doesNotMatch(taskPatchRouteSource, /caseMatter\s*:|communicationLogs|internalMemo/);

assert.match(taskPanelSource, /CaseTaskManagementPanel/);
assert.match(taskPanelSource, /업무 태스크 관리/);
assert.match(taskPanelSource, /method: "POST"/);
assert.match(taskPanelSource, /method: "PATCH"/);
assert.match(taskPanelSource, /mode: "metadata"/);
assert.match(taskPanelSource, /mode: "status"/);
assert.match(taskPanelSource, /DONE 처리/);
assert.match(taskPanelSource, /expectedUpdatedAt: snapshot\.updatedAt/);
assert.doesNotMatch(
  taskPanelSource,
  /communicationLogs|internalMemo|payloadJson|ADMIN_BASIC_AUTH_PASSWORD|RESEND_API_KEY|EMAIL_FROM/
);

console.log("case matter service metadata tests passed");
