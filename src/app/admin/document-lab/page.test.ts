import assert from "node:assert/strict";

import {
  listDocumentTemplateInventory,
  getDocumentTemplateOfficialSourceStatus,
  getDocumentTemplateOfficialSourceStatusLabel,
  normalizeDocumentTemplateInventoryFilters,
  filterDocumentTemplateInventory,
  groupDocumentTemplatesByCategory,
  buildDocumentTemplateReadiness,
  buildDocumentTemplateReadinessSummary,
  buildDocumentTemplateSourceVerificationPriority,
  type DocumentTemplateInventoryItem
} from "@/lib/document-templates";

// ---------------------------------------------------------------------------
// helpers: synthetic template factories
// ---------------------------------------------------------------------------

function makeTemplate(
  overrides: Partial<DocumentTemplateInventoryItem> = {}
): DocumentTemplateInventoryItem {
  return {
    id: "test_template",
    titleKo: "테스트 서식",
    category: "common",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx", "docx"],
    conversionStatus: "not_started",
    riskLevel: "medium",
    requiredFields: ["client.name"],
    optionalFields: ["client.contact"],
    officialSourceName: "테스트 출처",
    officialSourceReferenceKo: "테스트 참조",
    latestVerifiedAt: null,
    verifiedBy: null,
    verificationMemoKo: "메모",
    isManualOnly: false,
    notesKo: "비고",
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// 1. listDocumentTemplateInventory
// ---------------------------------------------------------------------------

const inventory = listDocumentTemplateInventory();
assert.ok(inventory.length > 0, "inventory should be non-empty");
assert.ok(
  inventory.every((t) => typeof t.id === "string" && t.id.length > 0),
  "every item must have a non-empty id"
);

// returns a copy, not the original array
const inventory2 = listDocumentTemplateInventory();
assert.notEqual(inventory, inventory2);

// ---------------------------------------------------------------------------
// 2. getDocumentTemplateOfficialSourceStatus
// ---------------------------------------------------------------------------

// needs_review: has source name but no latestVerifiedAt
assert.equal(
  getDocumentTemplateOfficialSourceStatus(makeTemplate()),
  "needs_review"
);

// verified: has source name + reference + latestVerifiedAt
assert.equal(
  getDocumentTemplateOfficialSourceStatus(
    makeTemplate({ latestVerifiedAt: "2026-01-01", verifiedBy: "admin" })
  ),
  "verified"
);

// pending: no source name, no reference
assert.equal(
  getDocumentTemplateOfficialSourceStatus(
    makeTemplate({ officialSourceName: "", officialSourceReferenceKo: "" })
  ),
  "pending"
);

// manual_only via isManualOnly flag
assert.equal(
  getDocumentTemplateOfficialSourceStatus(makeTemplate({ isManualOnly: true })),
  "manual_only"
);

// manual_only via conversionStatus
assert.equal(
  getDocumentTemplateOfficialSourceStatus(
    makeTemplate({ conversionStatus: "manual_only" })
  ),
  "manual_only"
);

// ---------------------------------------------------------------------------
// 3. getDocumentTemplateOfficialSourceStatusLabel
// ---------------------------------------------------------------------------

assert.equal(getDocumentTemplateOfficialSourceStatusLabel("verified"), "공식 출처 확인");
assert.equal(getDocumentTemplateOfficialSourceStatusLabel("pending"), "공식 출처 미확인");
assert.equal(getDocumentTemplateOfficialSourceStatusLabel("needs_review"), "최신성 확인 필요");
assert.equal(getDocumentTemplateOfficialSourceStatusLabel("manual_only"), "수동 작성 유지");

// ---------------------------------------------------------------------------
// 4. normalizeDocumentTemplateInventoryFilters
// ---------------------------------------------------------------------------

// empty params -> all nulls
const emptyFilters = normalizeDocumentTemplateInventoryFilters({});
assert.equal(emptyFilters.category, null);
assert.equal(emptyFilters.risk, null);
assert.equal(emptyFilters.conversionStatus, null);
assert.equal(emptyFilters.sourceStatus, null);
assert.equal(emptyFilters.q, null);

// valid values pass through
const validFilters = normalizeDocumentTemplateInventoryFilters({
  category: "immigration",
  risk: "high",
  sourceStatus: "pending"
});
assert.equal(validFilters.category, "immigration");
assert.equal(validFilters.risk, "high");
assert.equal(validFilters.sourceStatus, "pending");

// invalid values are discarded
const invalidFilters = normalizeDocumentTemplateInventoryFilters({
  category: "BOGUS",
  risk: "extreme"
});
assert.equal(invalidFilters.category, null);
assert.equal(invalidFilters.risk, null);

// array param picks first element
const arrayFilters = normalizeDocumentTemplateInventoryFilters({
  category: ["common", "immigration"]
});
assert.equal(arrayFilters.category, "common");

// ---------------------------------------------------------------------------
// 5. filterDocumentTemplateInventory
// ---------------------------------------------------------------------------

// filter by category
const immigrationOnly = filterDocumentTemplateInventory(
  inventory,
  normalizeDocumentTemplateInventoryFilters({ category: "immigration" })
);
assert.ok(immigrationOnly.length > 0);
assert.ok(immigrationOnly.every((t) => t.category === "immigration"));

// filter by risk
const highRiskOnly = filterDocumentTemplateInventory(
  inventory,
  normalizeDocumentTemplateInventoryFilters({ risk: "high" })
);
assert.ok(highRiskOnly.length > 0);
assert.ok(highRiskOnly.every((t) => t.riskLevel === "high"));

// filter with text query
const queryFiltered = filterDocumentTemplateInventory(
  inventory,
  normalizeDocumentTemplateInventoryFilters({ q: "위임장" })
);
assert.ok(queryFiltered.length >= 1);
assert.ok(queryFiltered.some((t) => t.titleKo === "위임장"));

// no-match query returns empty
const noMatch = filterDocumentTemplateInventory(
  inventory,
  normalizeDocumentTemplateInventoryFilters({ q: "ZZZZNONEXISTENT" })
);
assert.equal(noMatch.length, 0);

// ---------------------------------------------------------------------------
// 6. groupDocumentTemplatesByCategory
// ---------------------------------------------------------------------------

const grouped = groupDocumentTemplatesByCategory(inventory);
assert.ok(grouped.length > 0, "should have at least one category group");

// each group has items that all belong to its category
for (const group of grouped) {
  assert.ok(group.items.length > 0);
  assert.ok(group.items.every((t) => t.category === group.category));
}

// empty categories should be excluded
const emptyGrouped = groupDocumentTemplatesByCategory([]);
assert.equal(emptyGrouped.length, 0);

// ---------------------------------------------------------------------------
// 7. buildDocumentTemplateReadiness
// ---------------------------------------------------------------------------

// typical not-started template -> needs_source
const readiness = buildDocumentTemplateReadiness(makeTemplate());
assert.equal(readiness.templateId, "test_template");
assert.equal(readiness.status, "needs_source");
assert.ok(readiness.checks.length > 0);
assert.ok(readiness.requiredCount > 0);
assert.ok(readiness.missingRequiredChecks.length > 0);

// manual_only template
const manualReadiness = buildDocumentTemplateReadiness(
  makeTemplate({ conversionStatus: "manual_only" })
);
assert.equal(manualReadiness.status, "manual_only");

// high-risk template gets a warning
const highRiskReadiness = buildDocumentTemplateReadiness(
  makeTemplate({ riskLevel: "high" })
);
assert.ok(highRiskReadiness.warnings.length > 0);

// no latestVerifiedAt adds a warning
assert.ok(readiness.warnings.some((w) => w.includes("최신성")));

// ---------------------------------------------------------------------------
// 8. buildDocumentTemplateReadinessSummary
// ---------------------------------------------------------------------------

const summary = buildDocumentTemplateReadinessSummary(inventory);
assert.equal(summary.totalTemplates, inventory.length);
assert.equal(typeof summary.readyCandidateCount, "number");
assert.equal(typeof summary.sourceNeededCount, "number");
assert.equal(typeof summary.conversionTestNeededCount, "number");
assert.equal(typeof summary.manualOnlyCount, "number");

// counts should add up to total (all statuses accounted for)
const knownCounts =
  summary.readyCandidateCount +
  summary.sourceNeededCount +
  summary.conversionTestNeededCount +
  summary.manualOnlyCount;
assert.ok(
  knownCounts <= summary.totalTemplates,
  "known status counts must not exceed total"
);

// ---------------------------------------------------------------------------
// 9. buildDocumentTemplateSourceVerificationPriority
// ---------------------------------------------------------------------------

const priority = buildDocumentTemplateSourceVerificationPriority(inventory);
assert.equal(priority.totalTemplates, inventory.length);
assert.equal(typeof priority.urgentCount, "number");
assert.equal(typeof priority.highCount, "number");
assert.equal(typeof priority.normalCount, "number");
assert.equal(typeof priority.lowCount, "number");
assert.ok(
  priority.urgentCount + priority.highCount + priority.normalCount + priority.lowCount ===
    priority.totalTemplates,
  "priority counts must sum to total"
);
assert.ok(Array.isArray(priority.topPriorityTemplates));
assert.ok(priority.topPriorityTemplates.length <= 5);

// statusByRisk has all three risk levels
assert.ok("high" in priority.statusByRisk);
assert.ok("medium" in priority.statusByRisk);
assert.ok("low" in priority.statusByRisk);

// high-risk templates with pending/needs_review should be counted
assert.ok(
  priority.highRiskNeedsReviewCount >= 0,
  "highRiskNeedsReviewCount must be a number"
);

console.log("document-lab tests passed");
