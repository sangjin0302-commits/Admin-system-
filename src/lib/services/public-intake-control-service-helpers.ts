type PublicIntakeControlSnapshotLike = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  retryAfterSec: number;
  source: "env" | "db";
  updatedAt: string | null;
  updatedBy: string | null;
};

export type ParsedPublicIntakeControlPayload = {
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  retryAfterSec?: number;
  updatedBy?: string;
  changeReason?: string | null;
};

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function getEnvBoolean(name: string, defaultValue: boolean) {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function getEnvInt(name: string, defaultValue: number, min: number, max: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(max, Math.max(min, parsed));
}

export function clampRetryAfterSec(value: number) {
  return Math.min(86_400, Math.max(30, Math.trunc(value)));
}

export function sanitizeMessage(value: string | undefined, defaultMessage: string) {
  const trimmed = value?.trim();
  if (!trimmed) return defaultMessage;
  return trimmed.slice(0, 300);
}

export function sanitizeUpdatedBy(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "admin";
  return trimmed.slice(0, 80);
}

export function sanitizeChangeReason(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 300);
}

export function getEnvBaselineSnapshot(
  defaultMessage: string
): PublicIntakeControlSnapshotLike {
  return {
    maintenanceMode: getEnvBoolean("PUBLIC_INTAKE_MAINTENANCE_MODE", false),
    maintenanceMessage: process.env.PUBLIC_INTAKE_MAINTENANCE_MESSAGE?.trim() || defaultMessage,
    retryAfterSec: getEnvInt("PUBLIC_INTAKE_MAINTENANCE_RETRY_AFTER_SEC", 300, 30, 86_400),
    source: "env",
    updatedAt: null,
    updatedBy: null
  };
}

export function parsePublicIntakeControlPayload(
  payloadJson: string | null | undefined,
  defaultMessage: string
): ParsedPublicIntakeControlPayload | null {
  if (!payloadJson) return null;

  try {
    const parsed = JSON.parse(payloadJson) as Partial<{
      maintenanceMode: unknown;
      maintenanceMessage: unknown;
      retryAfterSec: unknown;
      updatedBy: unknown;
      changeReason: unknown;
    }>;

    const retryAfterSec =
      typeof parsed.retryAfterSec === "number" && Number.isFinite(parsed.retryAfterSec)
        ? clampRetryAfterSec(parsed.retryAfterSec)
        : undefined;

    return {
      maintenanceMode: typeof parsed.maintenanceMode === "boolean" ? parsed.maintenanceMode : undefined,
      maintenanceMessage:
        typeof parsed.maintenanceMessage === "string"
          ? sanitizeMessage(parsed.maintenanceMessage, defaultMessage)
          : undefined,
      retryAfterSec,
      updatedBy: typeof parsed.updatedBy === "string" ? sanitizeUpdatedBy(parsed.updatedBy) : undefined,
      changeReason:
        typeof parsed.changeReason === "string" ? sanitizeChangeReason(parsed.changeReason) : undefined
    };
  } catch {
    return null;
  }
}
