const SAFE_STATUS_LABELS = new Set([
  "접수 완료",
  "담당자 확인 중",
  "검토 진행 중",
  "추가자료 요청",
  "처리 완료"
]);

export const PUBLIC_TRACK_API_PATH = "/api/public/track";

export const PUBLIC_TRACK_GENERIC_NOT_FOUND_MESSAGE =
  "접수 정보를 찾을 수 없습니다. 접수번호와 휴대폰 뒤 4자리를 확인해 주세요.";

export const PUBLIC_TRACK_FORBIDDEN_RENDER_TOKENS = [
  "id",
  "inquiryId",
  "caseId",
  "caseRecordId",
  "workflowStatus",
  "bridgeWorkflowStatus",
  "lawbot",
  "Lawbot",
  "approvalGate",
  "reviewSignals",
  "mustVerify",
  "riskFlags",
  "documentDrafts",
  "messageDrafts",
  "communicationLogs",
  "adminNote"
] as const;

export type PublicTrackViewModel = {
  trackingCode: string;
  categoryLabel: string;
  categoryDetailLabel: string | null;
  receivedAtLabel: string;
  lastUpdatedAtLabel: string;
  customerStatusLabel: string;
  message: string;
  nextStepLabel: string;
  documentsRequested: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toSafeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toSafeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

export function normalizePublicTrackCodeInput(value: string) {
  return value.trim().toUpperCase();
}

export function normalizePublicTrackPhoneLast4Input(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 4 ? digits.slice(-4) : digits;
}

export function isPublicTrackLookupReady(input: {
  trackingCode: string;
  phoneLast4: string;
}) {
  return normalizePublicTrackCodeInput(input.trackingCode).length > 0 && input.phoneLast4.length === 4;
}

export function formatPublicTrackDateTime(value: unknown) {
  const raw = toSafeString(value);
  if (!raw) return "";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(date);
}

export function buildPublicTrackViewModel(input: unknown): PublicTrackViewModel | null {
  if (!isPlainObject(input)) return null;

  const trackingCode = toSafeString(input.trackingCode);
  const categoryLabel = toSafeString(input.categoryLabel);
  const customerStatusLabel = toSafeString(input.customerStatusLabel);
  const message = toSafeString(input.message);
  const nextStepLabel = toSafeString(input.nextStepLabel);
  const receivedAtLabel = formatPublicTrackDateTime(input.receivedAt);
  const lastUpdatedAtLabel = formatPublicTrackDateTime(input.lastUpdatedAt);

  if (
    !trackingCode ||
    !categoryLabel ||
    !customerStatusLabel ||
    !SAFE_STATUS_LABELS.has(customerStatusLabel) ||
    !message ||
    !nextStepLabel ||
    !receivedAtLabel ||
    !lastUpdatedAtLabel
  ) {
    return null;
  }

  return {
    trackingCode,
    categoryLabel,
    categoryDetailLabel: toSafeString(input.categoryDetailLabel),
    receivedAtLabel,
    lastUpdatedAtLabel,
    customerStatusLabel,
    message,
    nextStepLabel,
    documentsRequested: toSafeBoolean(input.documentsRequested)
  };
}
