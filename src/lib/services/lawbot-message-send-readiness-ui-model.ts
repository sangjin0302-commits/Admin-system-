const FORBIDDEN_MOJIBAKE_CHAR_PATTERN = /[\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/;

type JsonRecord = Record<string, unknown>;

export type LawbotMessageSendReadinessDraftUiModel = {
  id: string;
  status: string;
  reviewRequired: boolean;
  createdAt: string;
  updatedAt: string;
  readinessStatus: string;
  reasonCodes: string[];
};

export type LawbotMessageSendReadinessUiModel = {
  inquiryId: string;
  caseId: string | null;
  caseNumber: string | null;
  workflowStatus: string;
  sendReadiness: {
    status: string;
    ready: boolean;
    dryRunOnly: true;
    externalActionAllowed: false;
    reasonCodes: string[];
  };
  messageDrafts: LawbotMessageSendReadinessDraftUiModel[];
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
  return trimmed.replace(/[^a-zA-Z0-9_:-]/g, "_");
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
  return trimmed.replace(/[^a-zA-Z0-9_:-]/g, "_");
}

function toSafeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function toSafeReasonCodes(value: unknown, fallback: string) {
  if (!Array.isArray(value)) {
    return [fallback];
  }

  const normalized = value
    .filter((entry) => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && !hasForbiddenChars(entry))
    .map((entry) => entry.replace(/[^a-zA-Z0-9_:-]/g, "_"));

  if (normalized.length === 0) {
    return [fallback];
  }

  return [...new Set(normalized)];
}

function toDraftList(value: unknown): LawbotMessageSendReadinessDraftUiModel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry, index) => {
    const draft = asObject(entry);
    return {
      id: toSafeString(draft.id, `message-draft-${index + 1}`),
      status: toSafeString(draft.status, "UNKNOWN"),
      reviewRequired: toSafeBoolean(draft.reviewRequired, true),
      createdAt: toSafeString(draft.createdAt, new Date(0).toISOString()),
      updatedAt: toSafeString(draft.updatedAt, new Date(0).toISOString()),
      readinessStatus: toSafeString(draft.readinessStatus, "BLOCKED"),
      reasonCodes: toSafeReasonCodes(draft.reasonCodes, "BLOCKED")
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

export function buildLawbotMessageSendReadinessUiModel(
  rawResult: unknown
): LawbotMessageSendReadinessUiModel | null {
  if (!rawResult) {
    return null;
  }

  const result = asObject(rawResult);
  const sendReadiness = asObject(result.sendReadiness);
  const model: LawbotMessageSendReadinessUiModel = {
    inquiryId: toSafeString(result.inquiryId, "unknown-inquiry"),
    caseId: toSafeNullableString(result.caseId),
    caseNumber: toSafeNullableString(result.caseNumber),
    workflowStatus: toSafeString(result.workflowStatus, "UNKNOWN"),
    sendReadiness: {
      status: toSafeString(sendReadiness.status, "BLOCKED"),
      ready: toSafeBoolean(sendReadiness.ready, false),
      dryRunOnly: true,
      externalActionAllowed: false,
      reasonCodes: toSafeReasonCodes(sendReadiness.reasonCodes, "BLOCKED")
    },
    messageDrafts: toDraftList(result.messageDrafts)
  };

  if (hasForbiddenCharsDeep(model)) {
    return {
      ...model,
      sendReadiness: {
        ...model.sendReadiness,
        status: "BLOCKED",
        ready: false,
        dryRunOnly: true,
        externalActionAllowed: false,
        reasonCodes: ["BLOCKED"]
      },
      messageDrafts: model.messageDrafts.map((draft, index) => ({
        id: `message-draft-${index + 1}`,
        status: "UNKNOWN",
        reviewRequired: true,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        readinessStatus: "BLOCKED",
        reasonCodes: ["BLOCKED"]
      }))
    };
  }

  return model;
}
