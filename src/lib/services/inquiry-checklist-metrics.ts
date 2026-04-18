import {
  getInquiryChecklistProgress,
  type InquiryChecklistProgress
} from "@/lib/services/inquiry-checklist-state";

export type InquiryChecklistMetricSource = {
  id: string;
  internalMemo: string | null;
  lawbotSnapshotPayload: string | null;
  dueDate?: Date | null;
  responsePending?: boolean | null;
};

export type InquiryChecklistProgressSummary = {
  coverageCount: number;
  avgPercent: number;
  lowReadinessCount: number;
};

export function buildInquiryChecklistProgressMap<T extends InquiryChecklistMetricSource>(inquiries: T[]) {
  return new Map<string, InquiryChecklistProgress>(
    inquiries.map((item) => [
      item.id,
      getInquiryChecklistProgress({
        internalMemo: item.internalMemo,
        lawbotSnapshotPayload: item.lawbotSnapshotPayload,
        dueDate: item.dueDate,
        responsePending: Boolean(item.responsePending)
      })
    ])
  );
}

export function isChecklistLowReadiness(
  progress: InquiryChecklistProgress | undefined,
  thresholdPercent = 40
) {
  return Boolean(progress?.hasChecklist && (progress.percent ?? 0) <= thresholdPercent);
}

export function summarizeInquiryChecklistProgress<T extends { id: string }>(
  inquiries: T[],
  progressMap: Map<string, InquiryChecklistProgress>
): InquiryChecklistProgressSummary {
  const progresses = inquiries
    .map((item) => progressMap.get(item.id))
    .filter((entry): entry is InquiryChecklistProgress => Boolean(entry));

  const checklists = progresses.filter((entry) => entry.hasChecklist);
  const coverageCount = checklists.length;
  const avgPercent =
    coverageCount > 0
      ? Math.round(checklists.reduce((acc, entry) => acc + entry.percent, 0) / coverageCount)
      : 0;
  const lowReadinessCount = checklists.filter((entry) => entry.percent <= 40).length;

  return {
    coverageCount,
    avgPercent,
    lowReadinessCount
  };
}

export type InquiryWithChecklistProgress = {
  checklistProgressPercent: number;
  checklistPendingCount: number;
  checklistTotalCount: number;
  checklistHasData: boolean;
};

export function withInquiryChecklistProgress<T extends { id: string }>(
  inquiries: T[],
  progressMap: Map<string, InquiryChecklistProgress>
) {
  return inquiries.map((item) => {
    const progress = progressMap.get(item.id);
    return {
      ...item,
      checklistProgressPercent: progress?.percent ?? 0,
      checklistPendingCount: progress?.pending ?? 0,
      checklistTotalCount: progress?.total ?? 0,
      checklistHasData: Boolean(progress?.hasChecklist)
    };
  }) as Array<T & InquiryWithChecklistProgress>;
}
