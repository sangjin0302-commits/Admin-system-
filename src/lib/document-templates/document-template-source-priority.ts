import {
  getDocumentTemplateCategoryLabel,
  getDocumentTemplateOfficialSourceStatus,
  getDocumentTemplateOfficialSourceStatusLabel,
  type DocumentTemplateCategory,
  type DocumentTemplateInventoryItem,
  type DocumentTemplateOfficialSourceStatus,
  type DocumentTemplateRiskLevel
} from "./document-template-inventory";

export type DocumentTemplateSourceVerificationPriority = "urgent" | "high" | "normal" | "low";

export type DocumentTemplateSourceVerificationPriorityItem = {
  id: string;
  titleKo: string;
  category: DocumentTemplateCategory;
  categoryLabelKo: string;
  riskLevel: DocumentTemplateRiskLevel;
  sourceStatus: DocumentTemplateOfficialSourceStatus;
  sourceStatusLabelKo: string;
  priority: DocumentTemplateSourceVerificationPriority;
  reasonLabelKo: string;
};

export type DocumentTemplateSourceVerificationPrioritySummary = {
  totalTemplates: number;
  urgentCount: number;
  highCount: number;
  normalCount: number;
  lowCount: number;
  highRiskNeedsReviewCount: number;
  pendingCount: number;
  needsReviewCount: number;
  manualOnlyCount: number;
  topPriorityTemplates: DocumentTemplateSourceVerificationPriorityItem[];
  statusByRisk: Record<DocumentTemplateRiskLevel, Record<DocumentTemplateOfficialSourceStatus, number>>;
};

const priorityRank = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3
} satisfies Record<DocumentTemplateSourceVerificationPriority, number>;

const riskRank = {
  high: 0,
  medium: 1,
  low: 2
} satisfies Record<DocumentTemplateRiskLevel, number>;

function emptyStatusCounts(): Record<DocumentTemplateOfficialSourceStatus, number> {
  return {
    verified: 0,
    needs_review: 0,
    pending: 0,
    manual_only: 0
  };
}

export function getDocumentTemplateSourceVerificationPriority(
  template: DocumentTemplateInventoryItem
): DocumentTemplateSourceVerificationPriority {
  const sourceStatus = getDocumentTemplateOfficialSourceStatus(template);
  if (sourceStatus === "manual_only") return "low";
  if (template.riskLevel === "high" && (sourceStatus === "pending" || sourceStatus === "needs_review")) {
    return "urgent";
  }
  if (template.riskLevel === "medium" && (sourceStatus === "pending" || sourceStatus === "needs_review")) {
    return "high";
  }
  if (template.riskLevel === "low" && (sourceStatus === "pending" || sourceStatus === "needs_review")) {
    return "normal";
  }
  if (template.riskLevel === "high" && sourceStatus === "verified") return "normal";
  return "low";
}

export function getDocumentTemplateSourceVerificationPriorityReasonLabel(
  template: DocumentTemplateInventoryItem
) {
  const sourceStatus = getDocumentTemplateOfficialSourceStatus(template);
  if (sourceStatus === "manual_only") return "수동 작성 유지";
  if (template.riskLevel === "high" && sourceStatus === "pending") {
    return "고위험 서식의 공식 출처 확인 필요";
  }
  if (template.riskLevel === "high" && sourceStatus === "needs_review") {
    return "고위험 서식의 최신성 확인 필요";
  }
  if (sourceStatus === "pending") return "공식 출처 미확인";
  if (sourceStatus === "needs_review") return "최신성 확인 필요";
  return "공식 출처 확인";
}

export function listHighRiskTemplatesNeedingSourceReview(items: DocumentTemplateInventoryItem[]) {
  return items.filter((template) => {
    const sourceStatus = getDocumentTemplateOfficialSourceStatus(template);
    return template.riskLevel === "high" && (sourceStatus === "pending" || sourceStatus === "needs_review");
  });
}

export function groupSourceVerificationStatusByRisk(items: DocumentTemplateInventoryItem[]) {
  const groups = {
    low: emptyStatusCounts(),
    medium: emptyStatusCounts(),
    high: emptyStatusCounts()
  } satisfies Record<DocumentTemplateRiskLevel, Record<DocumentTemplateOfficialSourceStatus, number>>;

  for (const template of items) {
    groups[template.riskLevel][getDocumentTemplateOfficialSourceStatus(template)] += 1;
  }

  return groups;
}

function buildPriorityItem(template: DocumentTemplateInventoryItem): DocumentTemplateSourceVerificationPriorityItem {
  const sourceStatus = getDocumentTemplateOfficialSourceStatus(template);
  return {
    id: template.id,
    titleKo: template.titleKo,
    category: template.category,
    categoryLabelKo: getDocumentTemplateCategoryLabel(template.category),
    riskLevel: template.riskLevel,
    sourceStatus,
    sourceStatusLabelKo: getDocumentTemplateOfficialSourceStatusLabel(sourceStatus),
    priority: getDocumentTemplateSourceVerificationPriority(template),
    reasonLabelKo: getDocumentTemplateSourceVerificationPriorityReasonLabel(template)
  };
}

export function buildDocumentTemplateSourceVerificationPriority(
  items: DocumentTemplateInventoryItem[],
  topLimit = 5
): DocumentTemplateSourceVerificationPrioritySummary {
  const priorityItems = items.map(buildPriorityItem);
  const topPriorityTemplates = priorityItems
    .filter((item) => item.priority === "urgent" || item.priority === "high")
    .sort((left, right) => {
      const priorityDelta = priorityRank[left.priority] - priorityRank[right.priority];
      if (priorityDelta !== 0) return priorityDelta;
      const riskDelta = riskRank[left.riskLevel] - riskRank[right.riskLevel];
      if (riskDelta !== 0) return riskDelta;
      return left.id.localeCompare(right.id);
    })
    .slice(0, topLimit);

  return {
    totalTemplates: items.length,
    urgentCount: priorityItems.filter((item) => item.priority === "urgent").length,
    highCount: priorityItems.filter((item) => item.priority === "high").length,
    normalCount: priorityItems.filter((item) => item.priority === "normal").length,
    lowCount: priorityItems.filter((item) => item.priority === "low").length,
    highRiskNeedsReviewCount: listHighRiskTemplatesNeedingSourceReview(items).length,
    pendingCount: priorityItems.filter((item) => item.sourceStatus === "pending").length,
    needsReviewCount: priorityItems.filter((item) => item.sourceStatus === "needs_review").length,
    manualOnlyCount: priorityItems.filter((item) => item.sourceStatus === "manual_only").length,
    topPriorityTemplates,
    statusByRisk: groupSourceVerificationStatusByRisk(items)
  };
}
