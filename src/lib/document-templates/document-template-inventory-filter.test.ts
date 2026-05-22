import assert from "node:assert/strict";

import {
  documentTemplateInventory,
  getDocumentTemplateOfficialSourceStatus
} from "./document-template-inventory";
import {
  buildDocumentTemplateFilterHref,
  filterDocumentTemplateInventory,
  groupDocumentTemplatesByCategory,
  listDocumentTemplateCategories,
  listDocumentTemplateConversionStatuses,
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

const invalid = normalizeDocumentTemplateInventoryFilters({
  category: "bad",
  risk: "critical",
  conversionStatus: "done",
  sourceStatus: "unknown",
  q: "  "
});
assert.deepEqual(invalid, {
  category: null,
  risk: null,
  conversionStatus: null,
  sourceStatus: null,
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

const href = buildDocumentTemplateFilterHref(
  normalizeDocumentTemplateInventoryFilters({ sourceStatus: "needs_review", category: "immigration", q: "통합" }),
  { risk: "high" }
);
assert.equal(href.includes("sourceStatus=needs_review"), true);
assert.equal(href.includes("category=immigration"), true);
assert.equal(href.includes("risk=high"), true);
assert.equal(href.includes("q="), true);

const groups = groupDocumentTemplatesByCategory(documentTemplateInventory);
assert.ok(groups.length >= 4);
assert.ok(groups.every((group) => group.items.every((item) => item.category === group.category)));

console.log("document template inventory filter tests passed");
