import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma/client";

export type BackupSnapshot = {
  id: string;
  createdAt: Date;
  tables: { name: string; rowCount: number }[];
  sizeBytes: number;
  downloadUrl?: string;
};

const BACKUPS: BackupSnapshot[] = [];

const TARGET_TABLES = [
  "Inquiry",
  "CaseMatter",
  "BlogPost",
  "CaseEvent",
  "PortalClient",
  "CaseAccountingMemo",
] as const;

async function countTable(name: string): Promise<number> {
  try {
    const client = prisma as unknown as Record<string, { count: () => Promise<number> }>;
    const key = name.charAt(0).toLowerCase() + name.slice(1);
    const delegate = client[key];
    if (delegate && typeof delegate.count === "function") {
      return await delegate.count();
    }
  } catch {
    // swallow — count failures shouldn't break the snapshot list
  }
  return 0;
}

export async function createBackup(): Promise<BackupSnapshot> {
  const tables: { name: string; rowCount: number }[] = [];
  for (const t of TARGET_TABLES) {
    const rowCount = await countTable(t);
    tables.push({ name: t, rowCount });
  }
  const totalRows = tables.reduce((acc, t) => acc + t.rowCount, 0);
  // Approximate sizing - 512 bytes per row + metadata overhead. No actual file
  // is written; production would stream to S3 / GCS.
  const sizeBytes = totalRows * 512 + 4096;
  const snapshot: BackupSnapshot = {
    id: randomUUID(),
    createdAt: new Date(),
    tables,
    sizeBytes,
  };
  BACKUPS.unshift(snapshot);
  return snapshot;
}

export function listBackups(): BackupSnapshot[] {
  return BACKUPS.slice();
}

export function getRestoreSimulation(
  backupId: string,
): { canRestore: boolean; warnings: string[]; preview: string } {
  const snapshot = BACKUPS.find((b) => b.id === backupId);
  if (!snapshot) {
    return {
      canRestore: false,
      warnings: ["스냅샷을 찾을 수 없습니다."],
      preview: "",
    };
  }
  const warnings = [
    "복원은 시뮬레이션 모드입니다. 실제 데이터는 변경되지 않습니다.",
    "프로덕션 환경에서는 백업 전 트랜잭션 잠금이 필요합니다.",
  ];
  const preview = snapshot.tables
    .map((t) => `${t.name}: ${t.rowCount} rows`)
    .join("\n");
  return { canRestore: true, warnings, preview };
}
