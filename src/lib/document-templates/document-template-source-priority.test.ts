import assert from "node:assert/strict";

import { documentTemplateInventory, type DocumentTemplateInventoryItem } from "./document-template-inventory";
import {
  buildDocumentTemplateSourceVerificationPriority,
  getDocumentTemplateSourceVerificationPriority,
  getDocumentTemplateSourceVerificationPriorityReasonLabel,
  groupSourceVerificationStatusByRisk,
  listHighRiskTemplatesNeedingSourceReview
} from "./document-template-source-priority";

const base = documentTemplateInventory[0];

function fixture(overrides: Partial<DocumentTemplateInventoryItem>): DocumentTemplateInventoryItem {
  return {
    ...base,
    id: overrides.id ?? base.id,
    titleKo: overrides.titleKo ?? base.titleKo,
    riskLevel: overrides.riskLevel ?? base.riskLevel,
    officialSourceName: overrides.officialSourceName ?? "공식 출처 후보",
    officialSourceReferenceKo: overrides.officialSourceReferenceKo ?? "공식 출처 확인 필요",
    latestVerifiedAt: overrides.latestVerifiedAt ?? null,
    conversionStatus: overrides.conversionStatus ?? "not_started",
    isManualOnly: overrides.isManualOnly ?? false,
    verificationMemoKo: overrides.verificationMemoKo ?? base.verificationMemoKo
  };
}

const highPending = fixture({
  id: "high_pending",
  titleKo: "고위험 미확인",
  riskLevel: "high",
  officialSourceName: "",
  officialSourceReferenceKo: "",
  latestVerifiedAt: null
});
const highNeedsReview = fixture({
  id: "high_needs_review",
  titleKo: "고위험 최신성 확인",
  riskLevel: "high"
});
const mediumPending = fixture({
  id: "medium_pending",
  titleKo: "중간 미확인",
  riskLevel: "medium",
  officialSourceName: "",
  officialSourceReferenceKo: "",
  latestVerifiedAt: null
});
const lowVerified = fixture({
  id: "low_verified",
  titleKo: "낮은 위험 확인",
  riskLevel: "low",
  latestVerifiedAt: "2026-05-22"
});
const manualOnly = fixture({
  id: "manual_only",
  titleKo: "수동 유지",
  riskLevel: "high",
  conversionStatus: "manual_only",
  isManualOnly: true
});

assert.equal(getDocumentTemplateSourceVerificationPriority(highPending), "urgent");
assert.equal(getDocumentTemplateSourceVerificationPriority(highNeedsReview), "urgent");
assert.equal(getDocumentTemplateSourceVerificationPriority(mediumPending), "high");
assert.equal(getDocumentTemplateSourceVerificationPriority(lowVerified), "low");
assert.equal(getDocumentTemplateSourceVerificationPriority(manualOnly), "low");

assert.equal(getDocumentTemplateSourceVerificationPriorityReasonLabel(highPending), "고위험 서식의 공식 출처 확인 필요");
assert.equal(getDocumentTemplateSourceVerificationPriorityReasonLabel(highNeedsReview), "고위험 서식의 최신성 확인 필요");
assert.equal(getDocumentTemplateSourceVerificationPriorityReasonLabel(mediumPending), "공식 출처 미확인");
assert.equal(getDocumentTemplateSourceVerificationPriorityReasonLabel(manualOnly), "수동 작성 유지");

const fixtures = [mediumPending, lowVerified, highNeedsReview, manualOnly, highPending];
const summary = buildDocumentTemplateSourceVerificationPriority(fixtures);
assert.equal(summary.totalTemplates, 5);
assert.equal(summary.urgentCount, 2);
assert.equal(summary.highCount, 1);
assert.equal(summary.lowCount, 2);
assert.equal(summary.highRiskNeedsReviewCount, 2);
assert.equal(summary.pendingCount, 2);
assert.equal(summary.needsReviewCount, 1);
assert.equal(summary.manualOnlyCount, 1);
assert.deepEqual(
  summary.topPriorityTemplates.map((item) => item.id),
  ["high_needs_review", "high_pending", "medium_pending"]
);
assert.equal(summary.topPriorityTemplates[0].priority, "urgent");
assert.equal(summary.topPriorityTemplates[0].reasonLabelKo, "고위험 서식의 최신성 확인 필요");

const byRisk = groupSourceVerificationStatusByRisk(fixtures);
assert.equal(byRisk.high.pending, 1);
assert.equal(byRisk.high.needs_review, 1);
assert.equal(byRisk.high.manual_only, 1);
assert.equal(byRisk.medium.pending, 1);
assert.equal(byRisk.low.verified, 1);

assert.deepEqual(
  listHighRiskTemplatesNeedingSourceReview(fixtures).map((item) => item.id).sort(),
  ["high_needs_review", "high_pending"]
);

const emptySummary = buildDocumentTemplateSourceVerificationPriority([]);
assert.equal(emptySummary.topPriorityTemplates.length, 0);
assert.equal(emptySummary.urgentCount, 0);

console.log("document template source priority tests passed");
