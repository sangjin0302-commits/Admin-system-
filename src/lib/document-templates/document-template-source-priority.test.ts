import assert from "node:assert/strict";

import { documentTemplateInventory, type DocumentTemplateInventoryItem } from "./document-template-inventory";
import {
  buildDocumentTemplateSourceVerificationChecklist,
  buildDocumentTemplateSourceChecklistReasonBreakdown,
  buildDocumentTemplateSourceVerificationPriority,
  buildDocumentTemplateSourceVerificationWorkQueue,
  getDocumentTemplateSourceVerificationPriority,
  getDocumentTemplateSourceVerificationChecklistSummary,
  getTopDocumentTemplateSourceChecklistReasons,
  getDocumentTemplateSourceVerificationWorkQueueReason,
  getDocumentTemplateSourceVerificationPriorityReasonLabel,
  groupSourceVerificationStatusByRisk,
  listHighRiskTemplatesNeedingSourceReview,
  sortDocumentTemplateSourceVerificationWorkQueue
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
    verifiedBy: overrides.verifiedBy ?? base.verifiedBy,
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
  latestVerifiedAt: "2026-05-22",
  verifiedBy: "Admin",
  verificationMemoKo: "공식 출처와 최신 확인일을 기록했습니다."
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
const highVerifiedMissingDate = fixture({
  id: "high_verified_missing_date",
  riskLevel: "high",
  officialSourceName: "공식 출처 후보",
  officialSourceReferenceKo: "공식 출처 후보",
  latestVerifiedAt: null,
  verifiedBy: "Admin"
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

const reasonBreakdown = buildDocumentTemplateSourceChecklistReasonBreakdown(fixtures, 5);
const sourceReason = reasonBreakdown.find((item) => item.reasonId === "official_source_reference");
const latestReason = reasonBreakdown.find((item) => item.reasonId === "latest_verified_at");
const reviewerReason = reasonBreakdown.find((item) => item.reasonId === "verified_by");
const memoReason = reasonBreakdown.find((item) => item.reasonId === "verification_memo");
assert.equal(sourceReason?.labelKo, "공식 출처 확인 필요");
assert.equal(sourceReason?.count, 3);
assert.equal(sourceReason?.severity, "critical");
assert.equal(sourceReason?.href, "/admin/document-lab?risk=high&sourceStatus=pending");
assert.equal(latestReason?.count, 3);
assert.equal(reviewerReason?.count, 3);
assert.equal(memoReason, undefined);
assert.equal(buildDocumentTemplateSourceChecklistReasonBreakdown([lowVerified], 5).length, 0);
assert.equal(getTopDocumentTemplateSourceChecklistReasons(fixtures, 2).length, 2);

const highPendingReasons = getDocumentTemplateSourceVerificationWorkQueueReason(highPending);
assert.deepEqual(
  highPendingReasons.map((reason) => reason.id),
  [
    "official_source_missing",
    "latest_verified_at_missing",
    "verified_by_missing",
    "high_risk_review_needed"
  ]
);
assert.equal(highPendingReasons[0].labelKo, "공식 출처 확인 필요");

const highNeedsReviewReasons = getDocumentTemplateSourceVerificationWorkQueueReason(highNeedsReview);
assert.equal(highNeedsReviewReasons.some((reason) => reason.id === "latest_verified_at_missing"), true);
assert.equal(highNeedsReviewReasons.some((reason) => reason.id === "verified_by_missing"), true);
assert.equal(highNeedsReviewReasons.some((reason) => reason.id === "high_risk_review_needed"), true);

const noMemoReasons = getDocumentTemplateSourceVerificationWorkQueueReason(noMemo);
assert.equal(noMemoReasons.some((reason) => reason.id === "verification_memo_missing"), true);

const manualReasons = getDocumentTemplateSourceVerificationWorkQueueReason(manualOnly);
assert.deepEqual(manualReasons.map((reason) => reason.id), ["manual_only_review"]);

const workQueue = buildDocumentTemplateSourceVerificationWorkQueue(
  [mediumPending, lowVerified, highNeedsReview, manualOnly, highPending, highVerifiedMissingDate, noMemo],
  10
);
assert.equal(workQueue.some((item) => item.templateId === "low_verified"), false);
assert.deepEqual(
  workQueue.slice(0, 3).map((item) => item.templateId),
  ["high_pending", "high_needs_review", "high_verified_missing_date"]
);
assert.equal(workQueue[0].primaryReasonLabelKo, "공식 출처 확인 필요");
assert.equal(workQueue[0].href, "/admin/document-lab?risk=high&sourceStatus=pending");
assert.equal(workQueue.find((item) => item.templateId === "manual_only")?.primaryReasonLabelKo, "수동 작성 유지 검토");
assert.equal(buildDocumentTemplateSourceVerificationWorkQueue([lowVerified]).length, 0);
assert.deepEqual(
  sortDocumentTemplateSourceVerificationWorkQueue([...workQueue].reverse()).map((item) => item.templateId),
  workQueue.map((item) => item.templateId)
);

const emptySummary = buildDocumentTemplateSourceVerificationPriority([]);
assert.equal(emptySummary.topPriorityTemplates.length, 0);
assert.equal(emptySummary.urgentCount, 0);

console.log("document template source priority tests passed");
