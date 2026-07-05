/**
 * DB 읽기 복제본 라우팅.
 *
 * 환경변수:
 *   DATABASE_URL              — 주 DB (쓰기)
 *   DATABASE_READ_REPLICA_URL — 선택. 있으면 읽기 쿼리 라우팅.
 *
 * 사용법:
 *   import { readPrisma } from "@/lib/services/db-read-replica-service";
 *   const rows = await readPrisma().case.findMany({...});   // 복제본
 *   await prisma.case.update({...});                        // 주 DB
 *
 * 실패 복구: 복제본 쿼리 실패 시 자동으로 주 DB에서 재시도.
 * 미설정 시: 항상 주 DB 반환 (fallback).
 */

import { PrismaClient } from "@generated/prisma-client/client";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

let _replica: PrismaClient | null = null;
let _replicaDisabled = false;

const stats = {
  readReplica: 0,
  readPrimary: 0,
  fallbacks: 0,
  writesPrimary: 0,
  lastFallbackError: null as string | null,
};

function replicaConfigured(): boolean {
  return Boolean(process.env.DATABASE_READ_REPLICA_URL);
}

function getReplicaClient(): PrismaClient | null {
  if (_replicaDisabled) return null;
  if (!replicaConfigured()) return null;
  if (_replica) return _replica;
  try {
    _replica = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_READ_REPLICA_URL! } },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
    return _replica;
  } catch (err) {
    logger.warn("[db-replica] 복제본 클라이언트 생성 실패", err);
    _replicaDisabled = true;
    return null;
  }
}

/**
 * 읽기용 Prisma — 복제본 있으면 복제본, 없으면 주 DB.
 * 반환 시 통계 집계.
 */
export function readPrisma(): PrismaClient {
  const rep = getReplicaClient();
  if (rep) {
    stats.readReplica += 1;
    return rep;
  }
  stats.readPrimary += 1;
  return prisma;
}

/**
 * 명시적 fallback 래퍼 — 복제본 실패 시 주 DB로 자동 재시도.
 *
 * const cases = await readWithFallback((db) => db.case.findMany({...}));
 */
export async function readWithFallback<T>(fn: (db: PrismaClient) => Promise<T>): Promise<T> {
  const rep = getReplicaClient();
  if (!rep) {
    stats.readPrimary += 1;
    return fn(prisma);
  }
  try {
    stats.readReplica += 1;
    return await fn(rep);
  } catch (err) {
    stats.fallbacks += 1;
    stats.lastFallbackError = err instanceof Error ? err.message : String(err);
    logger.warn("[db-replica] 복제본 쿼리 실패 — 주 DB로 재시도", err);
    return fn(prisma);
  }
}

export function writePrisma(): PrismaClient {
  stats.writesPrimary += 1;
  return prisma;
}

export async function getReplicaStatus(): Promise<{
  primary: { ok: boolean; error?: string };
  replica: { configured: boolean; ok: boolean; error?: string };
  stats: typeof stats;
}> {
  let primaryOk = true;
  let primaryErr: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    primaryOk = false;
    primaryErr = err instanceof Error ? err.message : String(err);
  }

  const configured = replicaConfigured();
  let replicaOk = false;
  let replicaErr: string | undefined;
  if (configured) {
    const rep = getReplicaClient();
    if (rep) {
      try {
        await rep.$queryRaw`SELECT 1`;
        replicaOk = true;
      } catch (err) {
        replicaErr = err instanceof Error ? err.message : String(err);
      }
    } else {
      replicaErr = "클라이언트 생성 실패";
    }
  }

  return {
    primary: { ok: primaryOk, error: primaryErr },
    replica: { configured, ok: replicaOk, error: replicaErr },
    stats: { ...stats },
  };
}

export function resetReplicaStats(): void {
  stats.readReplica = 0;
  stats.readPrimary = 0;
  stats.fallbacks = 0;
  stats.writesPrimary = 0;
  stats.lastFallbackError = null;
}
