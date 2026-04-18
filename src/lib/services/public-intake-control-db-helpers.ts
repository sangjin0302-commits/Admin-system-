import { prisma } from "@/lib/prisma/client";
import { parsePublicIntakeControlPayload } from "@/lib/services/public-intake-control-service-helpers";
import type {
  PublicIntakeControlHistoryEntry,
  PublicIntakeControlSnapshot
} from "@/lib/services/public-intake-control-types";

export async function loadPublicIntakeSnapshotFromDb(input: {
  sourceKey: string;
  defaultMessage: string;
  fallback: PublicIntakeControlSnapshot;
}): Promise<PublicIntakeControlSnapshot> {
  const { sourceKey, defaultMessage, fallback } = input;

  try {
    const latest = await prisma.legacyImportLog.findFirst({
      where: { source: sourceKey },
      orderBy: { importedAt: "desc" }
    });

    if (!latest) {
      return fallback;
    }

    const parsed = parsePublicIntakeControlPayload(latest.payloadJson, defaultMessage);
    if (!parsed) {
      return fallback;
    }

    return {
      maintenanceMode: parsed.maintenanceMode ?? fallback.maintenanceMode,
      maintenanceMessage: parsed.maintenanceMessage ?? fallback.maintenanceMessage,
      retryAfterSec: parsed.retryAfterSec ?? fallback.retryAfterSec,
      source: "db",
      updatedAt: latest.importedAt.toISOString(),
      updatedBy: parsed.updatedBy ?? null
    };
  } catch {
    return fallback;
  }
}

export async function createPublicIntakeSnapshotLog(input: {
  sourceKey: string;
  version: string;
  payload: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    retryAfterSec: number;
    updatedBy: string;
    changeReason: string | null;
  };
}): Promise<PublicIntakeControlSnapshot> {
  const created = await prisma.legacyImportLog.create({
    data: {
      source: input.sourceKey,
      version: input.version,
      payloadJson: JSON.stringify(input.payload),
      createdCount: 1
    }
  });

  return {
    maintenanceMode: input.payload.maintenanceMode,
    maintenanceMessage: input.payload.maintenanceMessage,
    retryAfterSec: input.payload.retryAfterSec,
    source: "db",
    updatedAt: created.importedAt.toISOString(),
    updatedBy: input.payload.updatedBy
  };
}

export async function loadPublicIntakeHistoryFromDb(input: {
  sourceKey: string;
  defaultMessage: string;
  limit: number;
}): Promise<PublicIntakeControlHistoryEntry[]> {
  try {
    const rows = await prisma.legacyImportLog.findMany({
      where: { source: input.sourceKey },
      orderBy: { importedAt: "desc" },
      take: input.limit
    });

    return rows.map((row) => {
      const parsed = parsePublicIntakeControlPayload(row.payloadJson, input.defaultMessage);
      return {
        id: row.id,
        importedAt: row.importedAt.toISOString(),
        version: row.version,
        maintenanceMode: parsed?.maintenanceMode ?? null,
        maintenanceMessage: parsed?.maintenanceMessage ?? null,
        retryAfterSec: parsed?.retryAfterSec ?? null,
        updatedBy: parsed?.updatedBy ?? null,
        changeReason: parsed?.changeReason ?? null
      };
    });
  } catch {
    return [];
  }
}
