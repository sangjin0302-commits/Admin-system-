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

export type DocumentTemplateSourceVerificationChecklistItem = {
  id:
    | "official_source_reference"
    | "latest_verified_at"
    | "verified_by"
    | "verification_memo"
    | "manual_only";
  labelKo: string;
  status: "complete" | "missing" | "needs_review";
  valueKo: string;
};

export type DocumentTemplateSourceVerificationChecklistSummary = {
  completeCount: number;
  totalCount: number;
  items: DocumentTemplateSourceVerificationChecklistItem[];
};

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
  checklist: DocumentTemplateSourceVerificationChecklistSummary;
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

export type DocumentTemplateSourceChecklistReasonBreakdownItem = {
  reasonId: DocumentTemplateSourceVerificationChecklistItem["id"];
  labelKo: string;
  count: number;
  severity: "info" | "warning" | "critical";
  href: string;
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

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function buildDocumentTemplateSourceVerificationChecklist(
  template: DocumentTemplateInventoryItem
): DocumentTemplateSourceVerificationChecklistSummary {
  const sourceStatus = getDocumentTemplateOfficialSourceStatus(template);
  const hasSourceReference = hasText(template.officialSourceReferenceKo) || hasText(template.officialSourceName);
  const sourceReferenceStatus = !hasSourceReference
    ? "missing"
    : sourceStatus === "verified"
      ? "complete"
      : "needs_review";

  const items: DocumentTemplateSourceVerificationChecklistItem[] = [
    {
      id: "official_source_reference",
      labelKo: "공식 출처",
      status: sourceReferenceStatus,
      valueKo: template.officialSourceReferenceKo || template.officialSourceName || "확인 필요"
    },
    {
      id: "latest_verified_at",
      labelKo: "최신일",
      status: template.latestVerifiedAt ? "complete" : "missing",
      valueKo: template.latestVerifiedAt ?? "미확인"
    },
    {
      id: "verified_by",
      labelKo: "확인자",
      status: hasText(template.verifiedBy) ? "complete" : "missing",
      valueKo: template.verifiedBy ?? "미확인"
    },
    {
      id: "verification_memo",
      labelKo: "메모",
      status: hasText(template.verificationMemoKo) ? "complete" : "missing",
      valueKo: template.verificationMemoKo || "확인 필요"
    },
    {
      id: "manual_only",
      labelKo: "수동",
      status: template.isManualOnly ? "complete" : "missing",
      valueKo: template.isManualOnly ? "수동 작성 유지" : "아니오"
    }
  ];

  return {
    completeCount: items.filter((item) => item.status === "complete").length,
    totalCount: items.length,
    items
  };
}

export function getDocumentTemplateSourceVerificationChecklistSummary(
  template: DocumentTemplateInventoryItem
): string {
  const checklist = buildDocumentTemplateSourceVerificationChecklist(template);
  return checklist.items
    .filter((item) => item.status !== "complete")
    .slice(0, 3)
    .map((item) => `${item.labelKo} ${item.status === "needs_review" ? "검토 필요" : "확인 필요"}`)
    .join(" · ");
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
    reasonLabelKo: getDocumentTemplateSourceVerificationPriorityReasonLabel(template),
    checklist: buildDocumentTemplateSourceVerificationChecklist(template)
  };
}

const sourceChecklistReasonMeta = {
  official_source_reference: {
    labelKo: "공식 출처 확인 필요",
    severity: "critical",
    href: "/admin/document-lab?risk=high&sourceStatus=pending"
  },
  latest_verified_at: {
    labelKo: "최신 확인일 필요",
    severity: "critical",
    href: "/admin/document-lab?risk=high&sourceStatus=needs_review"
  },
  verified_by: {
    labelKo: "확인자 기록 필요",
    severity: "warning",
    href: "/admin/document-lab?risk=high&sourceStatus=needs_review"
  },
  verification_memo: {
    labelKo: "검토 메모 필요",
    severity: "warning",
    href: "/admin/document-lab?risk=high&sourceStatus=needs_review"
  },
  manual_only: {
    labelKo: "수동 작성 유지",
    severity: "info",
    href: "/admin/document-lab?sourceStatus=manual_only"
  }
} satisfies Record<
  DocumentTemplateSourceVerificationChecklistItem["id"],
  Omit<DocumentTemplateSourceChecklistReasonBreakdownItem, "reasonId" | "count">
>;

export function buildDocumentTemplateSourceChecklistReasonBreakdown(
  items: DocumentTemplateInventoryItem[],
  limit = 3
): DocumentTemplateSourceChecklistReasonBreakdownItem[] {
  const counts = new Map<DocumentTemplateSourceVerificationChecklistItem["id"], number>();
  const priorityItems = items
    .map(buildPriorityItem)
    .filter((item) => item.priority === "urgent" || item.priority === "high");

  for (const priorityItem of priorityItems) {
    for (const checklistItem of priorityItem.checklist.items) {
      if (checklistItem.id === "manual_only") continue;
      if (checklistItem.status === "complete") continue;
      counts.set(checklistItem.id, (counts.get(checklistItem.id) ?? 0) + 1);
    }
  }

  return Object.entries(sourceChecklistReasonMeta)
    .map(([reasonId, meta]) => ({
      reasonId: reasonId as DocumentTemplateSourceVerificationChecklistItem["id"],
      labelKo: meta.labelKo,
      severity: meta.severity,
      href: meta.href,
      count: counts.get(reasonId as DocumentTemplateSourceVerificationChecklistItem["id"]) ?? 0
    }))
    .filter((item) => item.count > 0)
    .sort((left, right) => {
      const countDelta = right.count - left.count;
      if (countDelta !== 0) return countDelta;
      return left.labelKo.localeCompare(right.labelKo);
    })
    .slice(0, limit);
}

export function getTopDocumentTemplateSourceChecklistReasons(items: DocumentTemplateInventoryItem[], limit = 3) {
  return buildDocumentTemplateSourceChecklistReasonBreakdown(items, limit);
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
