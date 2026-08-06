import assert from "node:assert/strict";

import {
  buildImmigrationCaseDetailPatchPayload,
  draftFromDetail,
  nullableDate,
  nullableText
} from "@/components/admin/immigration-case-detail-panel";

// ── nullableText ──────────────────────────────────────────────────────
assert.equal(nullableText("  국적  "), "국적");
assert.equal(nullableText("plain"), "plain");
assert.equal(nullableText(""), null);
assert.equal(nullableText("    "), null);

// ── nullableDate ──────────────────────────────────────────────────────
assert.equal(nullableDate("2026-02-10"), "2026-02-10");
assert.equal(nullableDate(""), null);

// ── draftFromDetail(null): empty strings + safe defaults ──────────────
const emptyDraft = draftFromDetail(null);
assert.equal(emptyDraft.dispositionType, "");
assert.equal(emptyDraft.dispositionDate, "");
assert.equal(emptyDraft.nationality, "");
assert.equal(emptyDraft.verifiedBy, "");
assert.equal(emptyDraft.scopeReviewRequired, true);
assert.equal(emptyDraft.attorneyScopeRisk, false);
assert.equal(emptyDraft.officialFormCheckRequired, true);
assert.equal(emptyDraft.syncCaseMatterDueDate, false);

// ── draftFromDetail(detail): maps fields + stringifies dates ──────────
const detail = {
  id: "detail-1",
  dispositionType: "VISA_ISSUANCE_SUPPORT",
  dispositionDate: new Date("2026-02-10T00:00:00Z"),
  noticeDate: new Date("2026-02-11T00:00:00Z"),
  serviceDate: new Date("2026-02-12T00:00:00Z"),
  appealDeadline: new Date("2026-03-01T00:00:00Z"),
  departureDeadline: null,
  detentionStartDate: null,
  stayExpiryDate: new Date("2026-06-30T00:00:00Z"),
  submissionDeadline: null,
  supplementDeadline: null,
  resultExpectedDate: null,
  nationality: "이라크",
  currentStayStatus: "D-2",
  familyInKoreaSummary: "배우자 국내 거주",
  residenceBaseSummary: "서울 거주",
  employmentOrSchoolSummary: "대학원 재학",
  violationHistorySummary: "",
  scopeReviewRequired: false,
  attorneyScopeRisk: true,
  officialFormCheckRequired: false,
  deadlineVerifiedAt: new Date("2026-02-13T00:00:00Z"),
  verifiedBy: "담당자",
  updatedAt: "2026-02-13T09:00:00.000Z"
};

const draft = draftFromDetail(detail);
assert.equal(draft.dispositionType, "VISA_ISSUANCE_SUPPORT");
assert.equal(draft.dispositionDate, "2026-02-10");
assert.equal(draft.noticeDate, "2026-02-11");
assert.equal(draft.serviceDate, "2026-02-12");
assert.equal(draft.appealDeadline, "2026-03-01");
assert.equal(draft.departureDeadline, "");
assert.equal(draft.stayExpiryDate, "2026-06-30");
assert.equal(draft.nationality, "이라크");
assert.equal(draft.currentStayStatus, "D-2");
assert.equal(draft.familyInKoreaSummary, "배우자 국내 거주");
assert.equal(draft.violationHistorySummary, "");
assert.equal(draft.scopeReviewRequired, false);
assert.equal(draft.attorneyScopeRisk, true);
assert.equal(draft.officialFormCheckRequired, false);
assert.equal(draft.syncCaseMatterDueDate, false); // never seeded from detail
assert.equal(draft.deadlineVerifiedAt, "2026-02-13");
assert.equal(draft.verifiedBy, "담당자");

// ── buildImmigrationCaseDetailPatchPayload with existing detail ───────
const draftForPayload = {
  ...draft,
  dispositionType: "  VISA_ISSUANCE_SUPPORT  ",
  nationality: "   ",
  verifiedBy: "",
  syncCaseMatterDueDate: true
};

const payload = buildImmigrationCaseDetailPatchPayload({
  draft: draftForPayload,
  immigrationDetail: detail,
  caseMatterUpdatedAt: "2026-01-01T00:00:00.000Z"
});

assert.equal(payload.dispositionType, "VISA_ISSUANCE_SUPPORT"); // trimmed
assert.equal(payload.nationality, null); // whitespace → null
assert.equal(payload.verifiedBy, null); // empty → null
assert.equal(payload.dispositionDate, "2026-02-10"); // passthrough date
assert.equal(payload.departureDeadline, null); // "" → null
assert.equal(payload.scopeReviewRequired, false);
assert.equal(payload.attorneyScopeRisk, true);
assert.equal(payload.officialFormCheckRequired, false);
assert.equal(payload.syncCaseMatterDueDate, true);
assert.equal(payload.actorName, "Admin");
// existing detail → optimistic lock on the detail row, not the case
assert.equal(payload.expectedUpdatedAt, "2026-02-13T09:00:00.000Z");
assert.equal(payload.expectedCaseUpdatedAt, undefined);

// ── buildImmigrationCaseDetailPatchPayload with no existing detail ────
const createPayload = buildImmigrationCaseDetailPatchPayload({
  draft: draftFromDetail(null),
  immigrationDetail: null,
  caseMatterUpdatedAt: "2026-01-01T00:00:00.000Z"
});

assert.equal(createPayload.dispositionType, null);
assert.equal(createPayload.actorName, "Admin");
assert.equal(createPayload.scopeReviewRequired, true);
assert.equal(createPayload.officialFormCheckRequired, true);
assert.equal(createPayload.syncCaseMatterDueDate, false);
// no detail yet → lock on the case row instead
assert.equal(createPayload.expectedUpdatedAt, undefined);
assert.equal(createPayload.expectedCaseUpdatedAt, "2026-01-01T00:00:00.000Z");

console.log("immigration-case-detail-panel helper tests passed");
