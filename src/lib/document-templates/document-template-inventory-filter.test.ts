import assert from "node:assert/strict";

import {
  documentTemplateInventory,
  getDocumentTemplateOfficialSourceStatus
} from "./document-template-inventory";
import {
  buildDocumentTemplateSourceStatusFilterOptions,
  buildDocumentTemplateFilterHref,
  countDocumentTemplatesBySourceStatus,
  filterDocumentTemplateInventory,
  groupDocumentTemplatesByCategory,
  listDocumentTemplateCategories,
  listDocumentTemplateConversionStatuses,
  listDocumentTemplateMissingReasons,
  listDocumentTemplateRiskLevels,
  listDocumentTemplateSourceStatuses,
  normalizeDocumentTemplateInventoryFilters
} from "./document-template-inventory-filter";

assert.deepEqual(listDocumentTemplateCategories(), [
  "common",
  "administrative_appeal",
  "immigration",
  "information_disclosure",
  "driver_license",
  "general_statement"
]);
assert.deepEqual(listDocumentTemplateRiskLevels(), ["low", "medium", "high"]);
assert.ok(listDocumentTemplateConversionStatuses().includes("not_started"));
assert.ok(listDocumentTemplateConversionStatuses().includes("manual_only"));
assert.deepEqual(listDocumentTemplateSourceStatuses(), ["verified", "needs_review", "pending", "manual_only"]);
assert.deepEqual(listDocumentTemplateMissingReasons(), [
  "official_source_missing",
  "latest_verified_at_missing",
  "verified_by_missing",
  "verification_memo_missing",
  "high_risk_review_needed",
  "manual_only_review"
]);

const invalid = normalizeDocumentTemplateInventoryFilters({
  category: "bad",
  risk: "critical",
  conversionStatus: "done",
  sourceStatus: "unknown",
  missingReason: "wrong",
  q: "  "
});
assert.deepEqual(invalid, {
  category: null,
  risk: null,
  conversionStatus: null,
  sourceStatus: null,
  missingReason: null,
  q: null
});
assert.equal(filterDocumentTemplateInventory(documentTemplateInventory, invalid).length, documentTemplateInventory.length);

const immigration = filterDocumentTemplateInventory(
  documentTemplateInventory,
  normalizeDocumentTemplateInventoryFilters({ category: "immigration" })
);
assert.equal(immigration.length, 4);
assert.ok(immigration.every((item) => item.category === "immigration"));

const highRisk = filterDocumentTemplateInventory(
  documentTemplateInventory,
  normalizeDocumentTemplateInventoryFilters({ risk: "high" })
);
assert.ok(highRisk.length > 0);
assert.ok(highRisk.every((item) => item.riskLevel === "high"));

const notStarted = filterDocumentTemplateInventory(
  documentTemplateInventory,
  normalizeDocumentTemplateInventoryFilters({ conversionStatus: "not_started" })
);
assert.equal(notStarted.length, documentTemplateInventory.length);

const verifiedFixture = {
  ...documentTemplateInventory[0],
  id: "verified_fixture",
  latestVerifiedAt: "2026-05-22"
};
const pendingFixture = {
  ...documentTemplateInventory[0],
  id: "pending_fixture",
  officialSourceName: "",
  officialSourceReferenceKo: "",
  latestVerifiedAt: null
};
const manualFixture = {
  ...documentTemplateInventory[0],
  id: "manual_fixture",
  conversionStatus: "manual_only" as const,
  isManualOnly: true
};
const sourceStatusFixtures = [verifiedFixture, documentTemplateInventory[0], pendingFixture, manualFixture];

assert.equal(getDocumentTemplateOfficialSourceStatus(verifiedFixture), "verified");
assert.equal(
  filterDocumentTemplateInventory(
    sourceStatusFixtures,
    normalizeDocumentTemplateInventoryFilters({ sourceStatus: "verified" })
  ).map((item) => item.id).join(","),
  "verified_fixture"
);
assert.equal(
  filterDocumentTemplateInventory(
    sourceStatusFixtures,
    normalizeDocumentTemplateInventoryFilters({ sourceStatus: "needs_review" })
  ).map((item) => item.id).join(","),
  documentTemplateInventory[0].id
);
assert.equal(
  filterDocumentTemplateInventory(
    sourceStatusFixtures,
    normalizeDocumentTemplateInventoryFilters({ sourceStatus: "pending" })
  ).map((item) => item.id).join(","),
  "pending_fixture"
);
assert.equal(
  filterDocumentTemplateInventory(
    sourceStatusFixtures,
    normalizeDocumentTemplateInventoryFilters({ sourceStatus: "manual_only" })
  ).map((item) => item.id).join(","),
  "manual_fixture"
);
assert.equal(
  filterDocumentTemplateInventory(
    documentTemplateInventory,
    normalizeDocumentTemplateInventoryFilters({ sourceStatus: "needs_review", category: "immigration" })
  ).length,
  4
);

assert.equal(
  filterDocumentTemplateInventory(documentTemplateInventory, normalizeDocumentTemplateInventoryFilters({ q: "행정심판" }))
    .length > 0,
  true
);
assert.equal(
  filterDocumentTemplateInventory(documentTemplateInventory, normalizeDocumentTemplateInventoryFilters({ q: "admin_appeal" }))
    .length > 0,
  true
);
assert.equal(
  filterDocumentTemplateInventory(documentTemplateInventory, normalizeDocumentTemplateInventoryFilters({ q: "출입국" }))
    .length > 0,
  true
);
assert.equal(
  filterDocumentTemplateInventory(documentTemplateInventory, normalizeDocumentTemplateInventoryFilters({ q: "no-match" }))
    .length,
  0
);
assert.equal(
  filterDocumentTemplateInventory(
    documentTemplateInventory,
    normalizeDocumentTemplateInventoryFilters({ sourceStatus: "needs_review", q: "행정심판" })
  ).length > 0,
  true
);

const sourceStatusCounts = countDocumentTemplatesBySourceStatus(
  sourceStatusFixtures,
  normalizeDocumentTemplateInventoryFilters({ sourceStatus: "needs_review" })
);
assert.deepEqual(sourceStatusCounts, {
  all: 4,
  verified: 1,
  needs_review: 1,
  pending: 1,
  manual_only: 1
});

const immigrationSourceStatusCounts = countDocumentTemplatesBySourceStatus(
  documentTemplateInventory,
  normalizeDocumentTemplateInventoryFilters({ category: "immigration" })
);
assert.equal(immigrationSourceStatusCounts.all, 4);
assert.equal(immigrationSourceStatusCounts.needs_review, 4);

const querySourceStatusCounts = countDocumentTemplatesBySourceStatus(
  sourceStatusFixtures,
  normalizeDocumentTemplateInventoryFilters({ q: "verified_fixture" })
);
assert.equal(querySourceStatusCounts.all, 1);
assert.equal(querySourceStatusCounts.verified, 1);
assert.equal(querySourceStatusCounts.needs_review, 0);

const sourceStatusOptions = buildDocumentTemplateSourceStatusFilterOptions(
  sourceStatusFixtures,
  normalizeDocumentTemplateInventoryFilters({ sourceStatus: "needs_review", category: "common" })
);
assert.equal(sourceStatusOptions.length, 5);
assert.equal(sourceStatusOptions[0].labelKo, "전체 source status");
assert.equal(sourceStatusOptions[0].count, 4);
assert.equal(sourceStatusOptions.find((option) => option.sourceStatus === "needs_review")?.isActive, true);
assert.equal(sourceStatusOptions.find((option) => option.sourceStatus === "pending")?.count, 1);
assert.equal(sourceStatusOptions.find((option) => option.sourceStatus === "pending")?.href.includes("category=common"), true);

const zeroCountOptions = buildDocumentTemplateSourceStatusFilterOptions(
  [verifiedFixture],
  normalizeDocumentTemplateInventoryFilters({})
);
assert.equal(zeroCountOptions.find((option) => option.sourceStatus === "pending")?.count, 0);

const href = buildDocumentTemplateFilterHref(
  normalizeDocumentTemplateInventoryFilters({
    sourceStatus: "needs_review",
    missingReason: "latest_verified_at_missing",
    category: "immigration",
    q: "통합"
  }),
  { risk: "high" }
);
assert.equal(href.includes("sourceStatus=needs_review"), true);
assert.equal(href.includes("missingReason=latest_verified_at_missing"), true);
assert.equal(href.includes("category=immigration"), true);
assert.equal(href.includes("risk=high"), true);
assert.equal(href.includes("q="), true);

const groups = groupDocumentTemplatesByCategory(documentTemplateInventory);
assert.ok(groups.length >= 4);
assert.ok(groups.every((group) => group.items.every((item) => item.category === group.category)));

console.log("document template inventory filter tests passed");
