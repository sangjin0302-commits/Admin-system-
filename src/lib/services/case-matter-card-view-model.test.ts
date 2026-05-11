import assert from "node:assert/strict";

import {
  buildCaseMatterDDay,
  buildRequiredDocumentStatusCounts,
  buildTaskDueState,
  isRequiredDocumentBacklog
} from "@/lib/services/case-matter-card-view-model";

const now = new Date("2026-05-11T09:00:00");

assert.deepEqual(buildCaseMatterDDay(null, now), {
  label: "D-day 없음",
  days: null,
  state: "none"
});

assert.deepEqual(buildCaseMatterDDay("2026-05-11T23:59:00", now), {
  label: "D-day",
  days: 0,
  state: "today"
});

assert.deepEqual(buildCaseMatterDDay("2026-05-14T00:00:00", now), {
  label: "D-3",
  days: 3,
  state: "future"
});

assert.deepEqual(buildCaseMatterDDay("2026-05-09T00:00:00", now), {
  label: "D+2",
  days: -2,
  state: "overdue"
});

const counts = buildRequiredDocumentStatusCounts([
  { status: "NEEDED" },
  { status: "REQUESTED" },
  { status: "RECEIVED" },
  { status: "IN_REVIEW" },
  { status: "NEEDS_FIX" },
  { status: "APPROVED" },
  { status: "APPROVED" }
]);

assert.equal(counts.NEEDED, 1);
assert.equal(counts.REQUESTED, 1);
assert.equal(counts.RECEIVED, 1);
assert.equal(counts.IN_REVIEW, 1);
assert.equal(counts.NEEDS_FIX, 1);
assert.equal(counts.APPROVED, 2);

assert.equal(isRequiredDocumentBacklog("NEEDED"), true);
assert.equal(isRequiredDocumentBacklog("REQUESTED"), true);
assert.equal(isRequiredDocumentBacklog("NEEDS_FIX"), true);
assert.equal(isRequiredDocumentBacklog("APPROVED"), false);

assert.equal(buildTaskDueState("2026-05-09T00:00:00", now), "overdue");
assert.equal(buildTaskDueState("2026-05-11T00:00:00", now), "due_today");
assert.equal(buildTaskDueState("2026-05-13T00:00:00", now), "due_soon");
assert.equal(buildTaskDueState("2026-05-20T00:00:00", now), "normal");

console.log("case matter card view model tests passed");
