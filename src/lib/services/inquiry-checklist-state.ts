const CHECKLIST_STATE_START = "[CHECKLIST_STATE_START]";
const CHECKLIST_STATE_END = "[CHECKLIST_STATE_END]";

export type InquiryChecklistStateSnapshot = {
  memo: string;
  block: string | null;
  doneIds: string[];
};

type ParsedLawbotOperationalSignals = {
  reviewRequiredReasons: string[];
  criticalMissingFacts: string[];
  documentChecklist: string[];
};

export type InquiryChecklistProgress = {
  total: number;
  done: number;
  pending: number;
  percent: number;
  hasChecklist: boolean;
};

function uniqueItems(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueItems(value.map((entry) => String(entry)));
}

export function parseLawbotOperationalSignals(raw?: string | null): ParsedLawbotOperationalSignals {
  if (!raw) {
    return {
      reviewRequiredReasons: [],
      criticalMissingFacts: [],
      documentChecklist: []
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      review_required_reasons?: unknown;
      critical_missing_facts?: unknown;
      document_checklist?: unknown;
    };

    return {
      reviewRequiredReasons: toStringArray(parsed.review_required_reasons),
      criticalMissingFacts: toStringArray(parsed.critical_missing_facts),
      documentChecklist: toStringArray(parsed.document_checklist)
    };
  } catch {
    return {
      reviewRequiredReasons: [],
      criticalMissingFacts: [],
      documentChecklist: []
    };
  }
}

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

export function parseInquiryChecklistState(raw?: string | null): InquiryChecklistStateSnapshot {
  if (!raw) {
    return {
      memo: "",
      block: null,
      doneIds: []
    };
  }

  const lines = raw.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === CHECKLIST_STATE_START);
  const endIndex =
    startIndex === -1
      ? -1
      : lines.findIndex((line, index) => index > startIndex && line.trim() === CHECKLIST_STATE_END);

  if (startIndex === -1 || endIndex === -1) {
    return {
      memo: raw.trim(),
      block: null,
      doneIds: []
    };
  }

  const block = lines.slice(startIndex, endIndex + 1).join("\n").trim();
  const doneIds = uniqueItems(
    lines
      .slice(startIndex + 1, endIndex)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("done="))
      .map((line) => line.slice("done=".length))
  );

  const memo = [...lines.slice(0, startIndex), ...lines.slice(endIndex + 1)]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    memo,
    block,
    doneIds
  };
}

export function buildInquiryChecklistStateBlock(doneIds: string[]) {
  const uniqueDoneIds = uniqueItems(doneIds);
  if (uniqueDoneIds.length === 0) {
    return "";
  }

  return [CHECKLIST_STATE_START, ...uniqueDoneIds.map((id) => `done=${id}`), CHECKLIST_STATE_END].join("\n");
}

export function attachInquiryChecklistStateBlock(
  memo: string | null | undefined,
  block: string | null | undefined
) {
  const baseMemo = (memo ?? "").trim();
  const trimmedBlock = (block ?? "").trim();

  if (baseMemo && trimmedBlock) {
    return `${baseMemo}\n\n${trimmedBlock}`;
  }

  if (baseMemo) {
    return baseMemo;
  }

  if (trimmedBlock) {
    return trimmedBlock;
  }

  return "";
}

export function mergeInquiryChecklistState(
  memo: string | null | undefined,
  doneIds: string[]
) {
  const block = buildInquiryChecklistStateBlock(doneIds);
  return attachInquiryChecklistStateBlock(memo, block);
}

export function stripInquiryChecklistState(raw?: string | null) {
  return parseInquiryChecklistState(raw).memo;
}
