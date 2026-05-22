import assert from "node:assert/strict";

import { documentTemplateInventory } from "./document-template-inventory";
import {
  filterDocumentTemplateInventory,
  groupDocumentTemplatesByCategory,
  listDocumentTemplateCategories,
  listDocumentTemplateConversionStatuses,
  listDocumentTemplateRiskLevels,
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

const invalid = normalizeDocumentTemplateInventoryFilters({
  category: "bad",
  risk: "critical",
  conversionStatus: "done",
  q: "  "
});
assert.deepEqual(invalid, {
  category: null,
  risk: null,
  conversionStatus: null,
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

const groups = groupDocumentTemplatesByCategory(documentTemplateInventory);
assert.ok(groups.length >= 4);
assert.ok(groups.every((group) => group.items.every((item) => item.category === group.category)));

console.log("document template inventory filter tests passed");
