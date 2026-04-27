const FORBIDDEN_MOJIBAKE_CHAR_PATTERN = /[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/;

export const LAWBOT_REVIEW_READONLY_NOTICE =
  "현재 이 화면은 읽기 전용이며 승인/발송/제출 기능은 비활성화되어 있습니다.";

type JsonRecord = Record<string, unknown>;

export type LawbotReviewReadonlyDraftViewModel = {
  id: string;
  status: string;
  reviewRequired: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LawbotReviewReadonlyUiModel = {
  inquiryId: string;
  caseId: string | null;
  caseNumber: string | null;
  workflowStatus: string;
  executionStatus: string;
  executionSummary: string;
  updatedAt: string;
  reviewRequired: boolean;
  readonlyNotice: string;
  approvalGate: {
    approvalRequired: true;
    externalActionAllowed: false;
    reasonCodes: string[];
  };
  reviewSignals: {
    mustVerifyCount: number;
    mustVerifySourcesCount: number;
    riskFlagsCount: number;
    sourceVerificationChecklist: {
      totalRequired: number;
    };
  };
  reviewQueue: {
    totalDrafts: number;
    approvalPendingDrafts: number;
    documentDrafts: LawbotReviewReadonlyDraftViewModel[];
    messageDrafts: LawbotReviewReadonlyDraftViewModel[];
  };
};

function asObject(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as JsonRecord;
}

function hasForbiddenChars(value: string) {
  return FORBIDDEN_MOJIBAKE_CHAR_PATTERN.test(value);
}

function toSafeString(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed || hasForbiddenChars(trimmed)) {
    return fallback;
  }
  return trimmed;
}

function toSafeNullableString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || hasForbiddenChars(trimmed)) {
    return null;
  }
  return trimmed;
}

function toSafeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  return fallback;
}

function toSafeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function toSafeReasonCodes(value: unknown) {
  if (!Array.isArray(value)) {
    return ["manual_approval_required"];
  }

  const normalized = value
    .filter((entry) => typeof entry === "string")
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0 && !hasForbiddenChars(entry))
    .map((entry) => entry.replace(/[^a-zA-Z0-9_:-]/g, "_"));

  if (normalized.length === 0) {
    return ["manual_approval_required"];
  }

  return [...new Set(normalized)];
}

function toDraftList(value: unknown, fallbackPrefix: string): LawbotReviewReadonlyDraftViewModel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry, index) => {
    const draft = asObject(entry);
    return {
      id: toSafeString(draft.id, `${fallbackPrefix}-${index + 1}`),
      status: toSafeString(draft.status, "APPROVAL_PENDING"),
      reviewRequired: toSafeBoolean(draft.reviewRequired, true),
      createdAt: toSafeString(draft.createdAt, new Date(0).toISOString()),
      updatedAt: toSafeString(draft.updatedAt, new Date(0).toISOString())
    };
  });
}

function hasForbiddenCharsDeep(value: unknown): boolean {
  if (typeof value === "string") {
    return hasForbiddenChars(value);
  }
  if (Array.isArray(value)) {
    return value.some((entry) => hasForbiddenCharsDeep(entry));
  }
  if (value && typeof value === "object") {
    return Object.values(value as JsonRecord).some((entry) => hasForbiddenCharsDeep(entry));
  }
  return false;
}

export function buildLawbotReviewReadonlyUiModel(
  rawResult: unknown
): LawbotReviewReadonlyUiModel | null {
  if (!rawResult) {
    return null;
  }

  const result = asObject(rawResult);
  const reviewSignals = asObject(result.reviewSignals);
  const sourceVerificationChecklist = asObject(reviewSignals.sourceVerificationChecklist);
  const reviewQueue = asObject(result.reviewQueue);
  const approvalGate = asObject(result.approvalGate);

  const documentDrafts = toDraftList(reviewQueue.documentDrafts, "document-draft");
  const messageDrafts = toDraftList(reviewQueue.messageDrafts, "message-draft");

  const viewModel: LawbotReviewReadonlyUiModel = {
    inquiryId: toSafeString(result.inquiryId, "unknown-inquiry"),
    caseId: toSafeNullableString(result.caseId),
    caseNumber: toSafeNullableString(result.caseNumber),
    workflowStatus: toSafeString(result.workflowStatus, "APPROVAL_PENDING"),
    executionStatus: toSafeString(result.executionStatus, "success"),
    executionSummary: toSafeString(result.executionSummary, "원문 확인 필요"),
    updatedAt: toSafeString(result.updatedAt, new Date(0).toISOString()),
    reviewRequired: toSafeBoolean(result.reviewRequired, true),
    readonlyNotice: LAWBOT_REVIEW_READONLY_NOTICE,
    approvalGate: {
      approvalRequired: true,
      externalActionAllowed: false,
      reasonCodes: toSafeReasonCodes(approvalGate.reasonCodes)
    },
    reviewSignals: {
      mustVerifyCount: toSafeNumber(reviewSignals.mustVerifyCount),
      mustVerifySourcesCount: toSafeNumber(reviewSignals.mustVerifySourcesCount),
      riskFlagsCount: toSafeNumber(reviewSignals.riskFlagsCount),
      sourceVerificationChecklist: {
        totalRequired: toSafeNumber(sourceVerificationChecklist.totalRequired)
      }
    },
    reviewQueue: {
      totalDrafts: toSafeNumber(reviewQueue.totalDrafts, documentDrafts.length + messageDrafts.length),
      approvalPendingDrafts: toSafeNumber(
        reviewQueue.approvalPendingDrafts,
        [...documentDrafts, ...messageDrafts].filter((draft) => draft.status === "APPROVAL_PENDING")
          .length
      ),
      documentDrafts,
      messageDrafts
    }
  };

  if (hasForbiddenCharsDeep(viewModel)) {
    return {
      ...viewModel,
      executionSummary: "원문 확인 필요",
      readonlyNotice: LAWBOT_REVIEW_READONLY_NOTICE
    };
  }

  return viewModel;
}
