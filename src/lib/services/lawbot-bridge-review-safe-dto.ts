const FORBIDDEN_MOJIBAKE_CHAR_PATTERN = /[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/;

const REVIEW_FALLBACK_TEXT = {
  generic: "원문 확인 필요"
} as const;

type JsonRecord = Record<string, unknown>;

type SafeReviewDraftDto = {
  id: string;
  status: string;
  reviewRequired: boolean;
  createdAt: string;
  updatedAt: string;
};

type SafeLawbotReviewDto = {
  inquiryId: string;
  caseId: string | null;
  caseNumber: string | null;
  workflowStatus: string;
  executionStatus: string;
  executionSummary: string;
  updatedAt: string;
  reviewRequired: boolean;
  approvalGate: {
    approvalRequired: true;
    externalActionAllowed: false;
    reasonCodes: string[];
  };
  reviewSignals: {
    reviewRequired: boolean;
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
    documentDrafts: SafeReviewDraftDto[];
    messageDrafts: SafeReviewDraftDto[];
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

  const cleaned = value
    .filter((entry) => typeof entry === "string")
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0 && !hasForbiddenChars(entry))
    .map((entry) => entry.replace(/[^a-zA-Z0-9_:-]/g, "_"));

  if (cleaned.length === 0) {
    return ["manual_approval_required"];
  }
  return [...new Set(cleaned)];
}

function toSafeDraftList(value: unknown, fallbackPrefix: string): SafeReviewDraftDto[] {
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

function countFromArrayOrNumber(value: unknown, explicitCount: unknown) {
  if (typeof explicitCount === "number" && Number.isFinite(explicitCount)) {
    return Math.max(0, Math.floor(explicitCount));
  }
  if (Array.isArray(value)) {
    return value.length;
  }
  return 0;
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

export function buildLawbotReviewSafeDto(rawResult: unknown): SafeLawbotReviewDto {
  const result = asObject(rawResult);
  const reviewSignals = asObject(result.reviewSignals);
  const sourceVerificationChecklist = asObject(reviewSignals.sourceVerificationChecklist);
  const reviewQueue = asObject(result.reviewQueue);
  const approvalGate = asObject(result.approvalGate);

  const mustVerifyCount = countFromArrayOrNumber(
    reviewSignals.mustVerify,
    reviewSignals.mustVerifyCount
  );
  const mustVerifySourcesCount = countFromArrayOrNumber(
    reviewSignals.mustVerifySources,
    reviewSignals.mustVerifySourcesCount
  );
  const riskFlagsCount = countFromArrayOrNumber(
    reviewSignals.riskFlags,
    reviewSignals.riskFlagsCount
  );
  const totalRequired = toSafeNumber(
    sourceVerificationChecklist.totalRequired,
    mustVerifySourcesCount
  );

  const documentDrafts = toSafeDraftList(reviewQueue.documentDrafts, "document-draft");
  const messageDrafts = toSafeDraftList(reviewQueue.messageDrafts, "message-draft");
  const totalDrafts = toSafeNumber(
    reviewQueue.totalDrafts,
    documentDrafts.length + messageDrafts.length
  );
  const approvalPendingDrafts = toSafeNumber(
    reviewQueue.approvalPendingDrafts,
    [...documentDrafts, ...messageDrafts].filter((draft) => draft.status === "APPROVAL_PENDING")
      .length
  );
  const reviewRequired = toSafeBoolean(reviewSignals.reviewRequired, true);

  const safeDto: SafeLawbotReviewDto = {
    inquiryId: toSafeString(result.inquiryId, "unknown-inquiry"),
    caseId: toSafeNullableString(result.caseId),
    caseNumber: toSafeNullableString(result.caseNumber),
    workflowStatus: toSafeString(result.workflowStatus, "APPROVAL_PENDING"),
    executionStatus: toSafeString(result.executionStatus, "success"),
    executionSummary: toSafeString(result.executionSummary, REVIEW_FALLBACK_TEXT.generic),
    updatedAt: toSafeString(result.updatedAt, new Date(0).toISOString()),
    reviewRequired,
    approvalGate: {
      approvalRequired: true,
      externalActionAllowed: false,
      reasonCodes: toSafeReasonCodes(approvalGate.reasonCodes)
    },
    reviewSignals: {
      reviewRequired,
      mustVerifyCount,
      mustVerifySourcesCount,
      riskFlagsCount,
      sourceVerificationChecklist: {
        totalRequired
      }
    },
    reviewQueue: {
      totalDrafts,
      approvalPendingDrafts,
      documentDrafts,
      messageDrafts
    }
  };

  // Fail-closed: if anything forbidden survives, collapse user-facing arrays to fallback.
  if (hasForbiddenCharsDeep(safeDto)) {
    safeDto.executionSummary = REVIEW_FALLBACK_TEXT.generic;
  }

  return safeDto;
}
