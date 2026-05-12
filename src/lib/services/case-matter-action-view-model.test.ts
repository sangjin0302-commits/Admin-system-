import assert from "node:assert/strict";

import { buildCaseMatterActionDashboard, type CaseMatterActionSource } from "@/lib/services/case-matter-action-view-model";

const now = new Date("2026-05-12T09:00:00");

function caseMatter(input: Partial<CaseMatterActionSource> & { id: string }): CaseMatterActionSource {
  return {
    id: input.id,
    caseNo: input.caseNo ?? `QA-${input.id}`,
    title: input.title ?? `Case ${input.id}`,
    status: input.status ?? "OPEN",
    priority: input.priority ?? "NORMAL",
    riskLevel: input.riskLevel ?? "LOW",
    dueDate: input.dueDate ?? null,
    nextActionAt: input.nextActionAt ?? null,
    updatedAt: input.updatedAt ?? "2026-05-12T00:00:00",
    nextAction: input.nextAction ?? { message: "Review next action" },
    tasks: input.tasks ?? [],
    requiredDocuments: input.requiredDocuments ?? [],
    supplementRequests: input.supplementRequests ?? [],
    submissions: input.submissions ?? []
  };
}

const dashboard = buildCaseMatterActionDashboard(
  [
    caseMatter({
      id: "today-next-action",
      nextActionAt: "2026-05-12T10:00:00"
    }),
    caseMatter({
      id: "overdue-case",
      dueDate: "2026-05-10T00:00:00"
    }),
    caseMatter({
      id: "task-due",
      tasks: [{ status: "TODO", priority: "HIGH", dueDate: "2026-05-12T00:00:00", assignedTo: "QA" }]
    }),
    caseMatter({
      id: "done-task-excluded",
      tasks: [{ status: "DONE", priority: "HIGH", dueDate: "2026-05-10T00:00:00", assignedTo: "QA" }]
    }),
    caseMatter({
      id: "due-soon",
      dueDate: "2026-05-18T00:00:00"
    }),
    caseMatter({
      id: "doc-due-soon",
      requiredDocuments: [{ status: "RECEIVED", dueDate: "2026-05-15T00:00:00" }]
    }),
    caseMatter({
      id: "doc-backlog",
      requiredDocuments: [{ status: "NEEDS_FIX", dueDate: null }]
    }),
    caseMatter({
      id: "supplement-backlog",
      supplementRequests: [{ status: "CLIENT_WAITING", dueDate: "2026-05-20T00:00:00" }]
    }),
    caseMatter({
      id: "waiting-agency",
      status: "WAITING_AGENCY"
    }),
    caseMatter({
      id: "stale",
      updatedAt: "2026-04-20T00:00:00"
    }),
    caseMatter({
      id: "agency-submission-waiting",
      submissions: [
        {
          status: "UNDER_REVIEW",
          submittedAt: "2026-04-20T00:00:00",
          resultReceivedAt: null
        }
      ]
    }),
    caseMatter({
      id: "closed-excluded",
      status: "CLOSED",
      dueDate: "2026-05-10T00:00:00",
      requiredDocuments: [{ status: "NEEDED", dueDate: null }]
    }),
    caseMatter({
      id: "cancelled-excluded",
      status: "CANCELLED",
      nextActionAt: "2026-05-12T00:00:00",
      supplementRequests: [{ status: "OVERDUE", dueDate: "2026-05-01T00:00:00" }]
    })
  ],
  now
);

assert.deepEqual(
  dashboard.today.map((item) => item.id).sort(),
  ["overdue-case", "task-due", "today-next-action"]
);
assert.equal(dashboard.today.find((item) => item.id === "overdue-case")?.ddayLabel, "D+2");
assert.equal(dashboard.today.find((item) => item.id === "today-next-action")?.tone, "warning");

assert.deepEqual(
  dashboard.dueSoon.map((item) => item.id).sort(),
  ["doc-due-soon", "due-soon"]
);

assert.deepEqual(
  dashboard.backlog.map((item) => item.id).sort(),
  ["doc-backlog", "supplement-backlog"]
);

assert.deepEqual(
  dashboard.stalled.map((item) => item.id).sort(),
  ["agency-submission-waiting", "stale", "waiting-agency"]
);

const empty = buildCaseMatterActionDashboard([], now);
assert.deepEqual(empty.today, []);
assert.deepEqual(empty.dueSoon, []);
assert.deepEqual(empty.backlog, []);
assert.deepEqual(empty.stalled, []);

console.log("case matter action view model tests passed");
