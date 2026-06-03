import { createHash } from "node:crypto";

export type NotionExportEntityType = "case_matter";

export type NotionExportDestination = "notion.case_management";

export type NotionSafeExportErrorCode =
  | "NOTION_FORBIDDEN_FIELD_BLOCKED"
  | "NOTION_EXPORT_NOT_ALLOWED"
  | "CASE_NOT_SAFE_FOR_EXPORT";

export const NOTION_CASE_MATTER_SAFE_EXPORT_FIELDS = [
  "caseNo",
  "title",
  "matterTypeLabel",
  "status",
  "dueDate",
  "assignedTo",
  "safeSummary",
  "createdAt",
  "updatedAt",
  "sourceTrackingCode",
  "adminCaseUrl"
] as const;

export type NotionCaseMatterSafeExportField = (typeof NOTION_CASE_MATTER_SAFE_EXPORT_FIELDS)[number];

export const NOTION_GLOBAL_FORBIDDEN_EXPORT_FIELDS = [
  "phone",
  "email",
  "fullAddress",
  "passportNumber",
  "alienRegistrationNumber",
  "residentRegistrationNumber",
  "birthdate",
  "internalMemo",
  "communicationLogs",
  "rawPayload",
  "rawInquiryBody",
  "rawProviderResponse",
  "secret",
  "authorization",
  "token",
  "privateDriveLink",
  "actualFilePath",
  "uploadedFileContent",
  "dispositionText",
  "familyDetail",
  "residenceDetail",
  "employmentDetail",
  "violationDetail",
  "feeAmount",
  "paidAmount",
  "paymentMemo",
  "invoiceMemo",
  "ledgerMemo"
] as const;

export type NotionForbiddenExportField = (typeof NOTION_GLOBAL_FORBIDDEN_EXPORT_FIELDS)[number];

const FORBIDDEN_FIELD_LABELS: Record<NotionForbiddenExportField, string> = {
  phone: "phone",
  email: "email",
  fullAddress: "full address",
  passportNumber: "passport number",
  alienRegistrationNumber: "alien registration number",
  residentRegistrationNumber: "resident registration number",
  birthdate: "birthdate",
  internalMemo: "internal memo",
  communicationLogs: "communication logs",
  rawPayload: "raw payload",
  rawInquiryBody: "raw inquiry body",
  rawProviderResponse: "raw provider response",
  secret: "secret",
  authorization: "authorization header",
  token: "token",
  privateDriveLink: "private Drive link",
  actualFilePath: "actual file path",
  uploadedFileContent: "uploaded file content",
  dispositionText: "disposition text",
  familyDetail: "family detail",
  residenceDetail: "residence detail",
  employmentDetail: "employment detail",
  violationDetail: "violation detail",
  feeAmount: "fee amount",
  paidAmount: "paid amount",
  paymentMemo: "payment memo",
  invoiceMemo: "invoice memo",
  ledgerMemo: "ledger memo"
};

export type NotionForbiddenFieldScanResult =
  | {
      ok: true;
      forbiddenKeys: [];
    }
  | {
      ok: false;
      forbiddenKeys: NotionForbiddenExportField[];
      errorCode: "NOTION_FORBIDDEN_FIELD_BLOCKED";
    };

export class NotionForbiddenFieldError extends Error {
  readonly errorCode = "NOTION_FORBIDDEN_FIELD_BLOCKED";
  readonly forbiddenKeys: NotionForbiddenExportField[];

  constructor(forbiddenKeys: NotionForbiddenExportField[]) {
    super("Notion export payload contains forbidden field keys.");
    this.name = "NotionForbiddenFieldError";
    this.forbiddenKeys = forbiddenKeys;
  }
}

export type CaseMatterNotionSafeSummaryInput = {
  id: string;
  caseNo?: string | null;
  title?: string | null;
  matterType?: string | null;
  matterTypeLabel?: string | null;
  status?: string | null;
  dueDate?: string | Date | null;
  assignedTo?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  sourceTrackingCode?: string | null;
  safeSummary?: string | null;
  adminCaseUrl?: string | null;
};

export type CaseMatterNotionSafeSummaryPayload = {
  entityType: "case_matter";
  fields: Partial<Record<NotionCaseMatterSafeExportField, string>>;
};

export type NotionExportIdempotencyKeyInput = {
  entityType: NotionExportEntityType;
  entityId: string;
  destination: NotionExportDestination;
};

export const NOTION_CASE_MANAGEMENT_MAPPING_DRAFT = {
  destination: "notion.case_management",
  entityType: "case_matter",
  properties: {
    title: "사건명",
    caseNo: "사건번호",
    matterTypeLabel: "업무분야",
    status: "진행상태",
    dueDate: "제출기한",
    assignedTo: "담당자",
    safeSummary: "다음 액션"
  }
} as const;

const forbiddenFieldSet = new Set<string>(NOTION_GLOBAL_FORBIDDEN_EXPORT_FIELDS);

export function getNotionExportForbiddenFieldLabels(): Record<NotionForbiddenExportField, string> {
  return { ...FORBIDDEN_FIELD_LABELS };
}

export function scanNotionExportForbiddenFields(payload: unknown): NotionForbiddenFieldScanResult {
  const found = new Set<NotionForbiddenExportField>();

  function visit(value: unknown): void {
    if (value === null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      if (forbiddenFieldSet.has(key)) {
        found.add(key as NotionForbiddenExportField);
      }
      visit(child);
    }
  }

  visit(payload);

  if (found.size === 0) {
    return { ok: true, forbiddenKeys: [] };
  }

  return {
    ok: false,
    forbiddenKeys: NOTION_GLOBAL_FORBIDDEN_EXPORT_FIELDS.filter((field) => found.has(field)),
    errorCode: "NOTION_FORBIDDEN_FIELD_BLOCKED"
  };
}

export function assertNoNotionForbiddenFields(payload: unknown): void {
  const result = scanNotionExportForbiddenFields(payload);
  if (!result.ok) {
    throw new NotionForbiddenFieldError(result.forbiddenKeys);
  }
}

export function buildCaseMatterNotionSafeSummaryPayload(
  input: CaseMatterNotionSafeSummaryInput
): CaseMatterNotionSafeSummaryPayload {
  const fields: Partial<Record<NotionCaseMatterSafeExportField, string>> = {};

  setIfPresent(fields, "caseNo", input.caseNo);
  setIfPresent(fields, "title", input.title);
  setIfPresent(fields, "matterTypeLabel", input.matterTypeLabel ?? input.matterType ?? "unknown");
  setIfPresent(fields, "status", input.status);
  setIfPresent(fields, "dueDate", normalizeDateLike(input.dueDate));
  setIfPresent(fields, "assignedTo", input.assignedTo);
  setIfPresent(fields, "safeSummary", input.safeSummary);
  setIfPresent(fields, "createdAt", normalizeDateLike(input.createdAt));
  setIfPresent(fields, "updatedAt", normalizeDateLike(input.updatedAt));
  setIfPresent(fields, "sourceTrackingCode", input.sourceTrackingCode);
  setIfPresent(fields, "adminCaseUrl", input.adminCaseUrl);

  return {
    entityType: "case_matter",
    fields
  };
}

export function buildNotionExportIdempotencyKey(input: NotionExportIdempotencyKeyInput): string {
  const entityLabel = input.entityType === "case_matter" ? "CaseMatter" : input.entityType;
  return `adminSystem:${entityLabel}:${input.entityId}:${input.destination}`;
}

export function hashNotionExportIdempotencyKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function redactNotionExportIdempotencyKey(key: string): string {
  const hash = hashNotionExportIdempotencyKey(key);
  return `sha256:${hash.slice(0, 12)}`;
}

function setIfPresent(
  fields: Partial<Record<NotionCaseMatterSafeExportField, string>>,
  key: NotionCaseMatterSafeExportField,
  value: string | null | undefined
): void {
  const normalized = typeof value === "string" ? value.trim() : value;
  if (normalized) {
    fields[key] = normalized;
  }
}

function normalizeDateLike(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value.trim() || undefined;
}
