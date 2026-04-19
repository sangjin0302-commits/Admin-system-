import { parseInquiryChecklistState } from "@/lib/services/inquiry-checklist-state-block-helpers";
import { parseLawbotOperationalSignals } from "@/lib/services/inquiry-checklist-state-operational-signal-parser";
import type { InquiryChecklistProgress } from "@/lib/services/inquiry-checklist-state-types";

function isWithinOneDay(date?: Date | null) {
  if (!date) return false;
  const now = Date.now();
  const target = date.getTime();
  return target >= now && target <= now + 24 * 60 * 60 * 1000;
}

function buildImmediateActionCount(input: {
  dueDate?: Date | null;
  responsePending: boolean;
  criticalMissingFacts: string[];
  documentChecklist: string[];
  reviewRequiredReasons: string[];
}) {
  const actions: string[] = [];
  const now = Date.now();
  const dueDateTime = input.dueDate?.getTime() ?? null;

  if (dueDateTime !== null && dueDateTime < now) {
    actions.push("due-overdue");
  } else if (isWithinOneDay(input.dueDate)) {
    actions.push("due-today");
  }

  if (input.responsePending) {
    actions.push("response-pending");
  }

  if (input.criticalMissingFacts.length > 0) {
    actions.push("missing-facts");
  }

  if (input.documentChecklist.length > 0) {
    actions.push("document-checklist");
  }

  if (input.reviewRequiredReasons.length > 0) {
    actions.push("review-reasons");
  }

  actions.push("route-alignment");

  return actions.slice(0, 5).length;
}

export function getInquiryChecklistProgress(input: {
  internalMemo?: string | null;
  lawbotSnapshotPayload?: string | null;
  dueDate?: Date | null;
  responsePending?: boolean;
}): InquiryChecklistProgress {
  const checklistState = parseInquiryChecklistState(input.internalMemo);
  const operationalSignals = parseLawbotOperationalSignals(input.lawbotSnapshotPayload);
  const total = buildImmediateActionCount({
    dueDate: input.dueDate,
    responsePending: Boolean(input.responsePending),
    criticalMissingFacts: operationalSignals.criticalMissingFacts,
    documentChecklist: operationalSignals.documentChecklist,
    reviewRequiredReasons: operationalSignals.reviewRequiredReasons
  });
  const done = Math.min(checklistState.doneIds.length, total);
  const pending = Math.max(total - done, 0);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    total,
    done,
    pending,
    percent,
    hasChecklist: total > 0
  };
}
