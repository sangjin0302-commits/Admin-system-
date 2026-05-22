import assert from "node:assert/strict";

import { documentTemplateInventory, type DocumentTemplateInventoryItem } from "./document-template-inventory";
import {
  buildDocumentTemplateSourceVerificationChecklist,
  buildDocumentTemplateSourceVerificationPriority,
  getDocumentTemplateSourceVerificationPriority,
  getDocumentTemplateSourceVerificationChecklistSummary,
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
const noMemo = fixture({
  id: "no_memo",
  riskLevel: "medium",
  verificationMemoKo: ""
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

const highNeedsReviewChecklist = buildDocumentTemplateSourceVerificationChecklist(highNeedsReview);
assert.equal(highNeedsReviewChecklist.totalCount, 5);
assert.equal(highNeedsReviewChecklist.items.find((item) => item.id === "official_source_reference")?.status, "needs_review");
assert.equal(highNeedsReviewChecklist.items.find((item) => item.id === "latest_verified_at")?.status, "missing");
assert.equal(highNeedsReviewChecklist.items.find((item) => item.id === "verified_by")?.status, "missing");
assert.equal(highNeedsReviewChecklist.items.find((item) => item.id === "verification_memo")?.status, "complete");
assert.equal(highNeedsReviewChecklist.items.find((item) => item.id === "manual_only")?.valueKo, "아니오");
assert.equal(getDocumentTemplateSourceVerificationChecklistSummary(highNeedsReview).includes("최신일 확인 필요"), true);

const highPendingChecklist = buildDocumentTemplateSourceVerificationChecklist(highPending);
assert.equal(highPendingChecklist.items.find((item) => item.id === "official_source_reference")?.status, "missing");
assert.equal(highPendingChecklist.items.find((item) => item.id === "official_source_reference")?.valueKo, "확인 필요");

const lowVerifiedChecklist = buildDocumentTemplateSourceVerificationChecklist(lowVerified);
assert.equal(lowVerifiedChecklist.items.find((item) => item.id === "official_source_reference")?.status, "complete");
assert.equal(lowVerifiedChecklist.items.find((item) => item.id === "latest_verified_at")?.status, "complete");

const manualChecklist = buildDocumentTemplateSourceVerificationChecklist(manualOnly);
assert.equal(manualChecklist.items.find((item) => item.id === "manual_only")?.status, "complete");
assert.equal(manualChecklist.items.find((item) => item.id === "manual_only")?.valueKo, "수동 작성 유지");

const noMemoChecklist = buildDocumentTemplateSourceVerificationChecklist(noMemo);
assert.equal(noMemoChecklist.items.find((item) => item.id === "verification_memo")?.status, "missing");

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
assert.equal(summary.topPriorityTemplates[0].checklist.items.length, 5);

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
