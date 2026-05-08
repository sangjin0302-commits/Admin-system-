export const INTAKE_SOURCE_TRACKING_PARAM_KEYS = [
  "source",
  "channel",
  "practice_area",
  "content_id",
  "package_id",
  "campaign_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "ref"
] as const;

export const INTAKE_SOURCE_TRACKING_TEXT_MAX_LENGTH = 160;
export const INTAKE_SOURCE_TRACKING_URL_MAX_LENGTH = 2048;

export type IntakeSourceTrackingParamKey = typeof INTAKE_SOURCE_TRACKING_PARAM_KEYS[number];

export type IntakeSourceTrackingPayload = Partial<Record<IntakeSourceTrackingParamKey, string>> & {
  landing_url?: string;
  captured_at?: string;
};

export type IntakeSourceTrackingData = {
  intakeSource?: string;
  intakeChannel?: string;
  intakePracticeArea?: string;
  intakeContentId?: string;
  intakePackageId?: string;
  intakeCampaignId?: string;
  intakeUtmSource?: string;
  intakeUtmMedium?: string;
  intakeUtmCampaign?: string;
  intakeUtmContent?: string;
  intakeRef?: string;
  intakeLandingUrl?: string;
  intakeTrackingCapturedAt?: Date;
};

export type IntakeSourceTrackingRecord = {
  intakeSource?: string | null;
  intakeChannel?: string | null;
  intakePracticeArea?: string | null;
  intakeContentId?: string | null;
  intakePackageId?: string | null;
  intakeCampaignId?: string | null;
  intakeUtmSource?: string | null;
  intakeUtmMedium?: string | null;
  intakeUtmCampaign?: string | null;
  intakeUtmContent?: string | null;
  intakeRef?: string | null;
  intakeLandingUrl?: string | null;
  intakeTrackingCapturedAt?: Date | string | null;
};

export type IntakeSourceTrackingViewModel = {
  hasTracking: boolean;
  rows: Array<{
    key: keyof IntakeSourceTrackingRecord;
    label: string;
    value: string;
    isUrl?: boolean;
  }>;
};

type SearchParamsLike = Record<string, string | string[] | undefined>;

const payloadKeyToDataKey = {
  source: "intakeSource",
  channel: "intakeChannel",
  practice_area: "intakePracticeArea",
  content_id: "intakeContentId",
  package_id: "intakePackageId",
  campaign_id: "intakeCampaignId",
  utm_source: "intakeUtmSource",
  utm_medium: "intakeUtmMedium",
  utm_campaign: "intakeUtmCampaign",
  utm_content: "intakeUtmContent",
  ref: "intakeRef"
} as const satisfies Record<IntakeSourceTrackingParamKey, keyof IntakeSourceTrackingData>;

const viewRows = [
  ["intakeSource", "Source"],
  ["intakeChannel", "Channel"],
  ["intakePracticeArea", "Practice area"],
  ["intakeContentId", "Content ID"],
  ["intakePackageId", "Package ID"],
  ["intakeCampaignId", "Campaign ID"],
  ["intakeUtmSource", "UTM source"],
  ["intakeUtmMedium", "UTM medium"],
  ["intakeUtmCampaign", "UTM campaign"],
  ["intakeUtmContent", "UTM content"],
  ["intakeRef", "Ref"],
  ["intakeLandingUrl", "Landing URL"],
  ["intakeTrackingCapturedAt", "Captured at"]
] as const satisfies ReadonlyArray<readonly [keyof IntakeSourceTrackingRecord, string]>;

function firstParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function sanitizeIntakeTrackingText(
  value: unknown,
  maxLength = INTAKE_SOURCE_TRACKING_TEXT_MAX_LENGTH
) {
  if (typeof value !== "string") return undefined;
  const normalized = value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\r\n]/g, "")
    .normalize("NFC")
    .trim();
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function sanitizeLandingUrl(value: unknown) {
  return sanitizeIntakeTrackingText(value, INTAKE_SOURCE_TRACKING_URL_MAX_LENGTH);
}

function hasAnyTrackingParam(payload: IntakeSourceTrackingPayload) {
  return INTAKE_SOURCE_TRACKING_PARAM_KEYS.some((key) => Boolean(payload[key]));
}

function buildSafeLandingPath(payload: IntakeSourceTrackingPayload) {
  const query = new URLSearchParams();
  for (const key of INTAKE_SOURCE_TRACKING_PARAM_KEYS) {
    const value = payload[key];
    if (value) query.set(key, value);
  }
  const serialized = query.toString();
  return serialized ? `/intake?${serialized}` : undefined;
}

export function buildIntakeSourceTrackingFromSearchParams(
  searchParams: SearchParamsLike,
  capturedAt = new Date()
): IntakeSourceTrackingPayload {
  const payload: IntakeSourceTrackingPayload = {};
  for (const key of INTAKE_SOURCE_TRACKING_PARAM_KEYS) {
    const value = sanitizeIntakeTrackingText(firstParamValue(searchParams[key]));
    if (value) {
      payload[key] = value;
    }
  }

  if (!hasAnyTrackingParam(payload)) {
    return {};
  }

  const landingUrl = buildSafeLandingPath(payload);
  if (landingUrl) {
    payload.landing_url = sanitizeLandingUrl(landingUrl);
  }
  payload.captured_at = capturedAt.toISOString();
  return payload;
}

export function normalizeIntakeSourceTrackingPayload(value: unknown): IntakeSourceTrackingData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const input = value as Record<string, unknown>;
  const data: IntakeSourceTrackingData = {};
  let hasTracking = false;

  for (const key of INTAKE_SOURCE_TRACKING_PARAM_KEYS) {
    const sanitized = sanitizeIntakeTrackingText(input[key]);
    if (!sanitized) continue;
    data[payloadKeyToDataKey[key]] = sanitized;
    hasTracking = true;
  }

  const landingUrl = sanitizeLandingUrl(input.landing_url);
  if (landingUrl) {
    data.intakeLandingUrl = landingUrl;
    hasTracking = true;
  }

  if (hasTracking) {
    const capturedAtRaw = sanitizeIntakeTrackingText(input.captured_at);
    const capturedAt = capturedAtRaw ? new Date(capturedAtRaw) : new Date();
    data.intakeTrackingCapturedAt = Number.isNaN(capturedAt.getTime()) ? new Date() : capturedAt;
  }

  return data;
}

function formatTrackingDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function safeRecordText(value: unknown) {
  return sanitizeIntakeTrackingText(value, INTAKE_SOURCE_TRACKING_URL_MAX_LENGTH) ?? "";
}

export function buildIntakeSourceTrackingViewModel(
  record: IntakeSourceTrackingRecord
): IntakeSourceTrackingViewModel {
  const rows = viewRows
    .map(([key, label]) => {
      const value =
        key === "intakeTrackingCapturedAt"
          ? formatTrackingDate(record[key])
          : safeRecordText(record[key]);
      if (!value) return null;
      return {
        key,
        label,
        value,
        isUrl: key === "intakeLandingUrl"
      };
    })
    .filter(Boolean) as IntakeSourceTrackingViewModel["rows"];

  const hasCampaignTracking = rows.some(
    (row) => row.key !== "intakeSource" || row.value !== "website"
  );

  return {
    hasTracking: hasCampaignTracking,
    rows: hasCampaignTracking ? rows : []
  };
}
