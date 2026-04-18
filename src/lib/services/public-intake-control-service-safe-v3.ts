import {
  clampRetryAfterSec,
  getEnvBaselineSnapshot,
  isDatabaseConfigured,
  sanitizeChangeReason,
  sanitizeMessage,
  sanitizeUpdatedBy
} from "@/lib/services/public-intake-control-service-helpers";
import {
  createPublicIntakeSnapshotLog,
  loadPublicIntakeHistoryFromDb,
  loadPublicIntakeSnapshotFromDb
} from "@/lib/services/public-intake-control-db-helpers";
import type {
  PublicIntakeControlCapabilities,
  PublicIntakeControlHistoryEntry,
  PublicIntakeControlSnapshot,
  UpdatePublicIntakeControlInput
} from "@/lib/services/public-intake-control-types";

const SOURCE_KEY = "system-control.public-intake";
const VERSION = "v1";
const DEFAULT_KO_MAINTENANCE_MESSAGE =
  "현재 접수 시스템 점검 중입니다. 잠시 후 다시 시도해 주세요.";
const READ_ONLY_REASON =
  "DATABASE_URL이 설정되지 않아 유지보수 모드 설정은 읽기 전용입니다.";

export type {
  PublicIntakeControlCapabilities,
  PublicIntakeControlHistoryEntry,
  PublicIntakeControlSnapshot,
  UpdatePublicIntakeControlInput
};

export function getPublicIntakeControlCapabilities(): PublicIntakeControlCapabilities {
  if (isDatabaseConfigured()) {
    return {
      writable: true,
      reason: null
    };
  }

  return {
    writable: false,
    reason: READ_ONLY_REASON
  };
}

export async function getPublicIntakeControlSnapshot(): Promise<PublicIntakeControlSnapshot> {
  const fallback = getEnvBaselineSnapshot(DEFAULT_KO_MAINTENANCE_MESSAGE);
  if (!isDatabaseConfigured()) {
    return fallback;
  }

  return loadPublicIntakeSnapshotFromDb({
    sourceKey: SOURCE_KEY,
    defaultMessage: DEFAULT_KO_MAINTENANCE_MESSAGE,
    fallback
  });
}

export async function updatePublicIntakeControl(
  input: UpdatePublicIntakeControlInput
): Promise<PublicIntakeControlSnapshot> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured");
  }

  const current = await getPublicIntakeControlSnapshot();
  const next = {
    maintenanceMode: Boolean(input.maintenanceMode),
    maintenanceMessage: sanitizeMessage(
      input.maintenanceMessage ?? current.maintenanceMessage,
      DEFAULT_KO_MAINTENANCE_MESSAGE
    ),
    retryAfterSec: clampRetryAfterSec(input.retryAfterSec ?? current.retryAfterSec),
    updatedBy: sanitizeUpdatedBy(input.updatedBy),
    changeReason: sanitizeChangeReason(input.changeReason)
  };

  return createPublicIntakeSnapshotLog({
    sourceKey: SOURCE_KEY,
    version: VERSION,
    payload: next
  });
}

export async function listPublicIntakeControlHistory(
  limit = 20
): Promise<PublicIntakeControlHistoryEntry[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const safeLimit = Math.min(50, Math.max(1, Math.trunc(limit)));
  return loadPublicIntakeHistoryFromDb({
    sourceKey: SOURCE_KEY,
    defaultMessage: DEFAULT_KO_MAINTENANCE_MESSAGE,
    limit: safeLimit
  });
}
