/**
 * 운영 정리 (cleanup):
 * - 사건 종결 (CLOSED) 후 N일 경과 → archived 마킹 (status: CLOSED 유지, 이벤트 기록)
 * - 의뢰인 포털 reset 토큰 만료된 것 정리
 * - 미연결 업로드 파일 (clientId 없는 orphan) 30일 후 삭제
 * - 닫힌 사건의 자동 알림 task 중 미완료 → CANCELLED
 */

import { unlink, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma/client";

const ARCHIVE_AFTER_DAYS = 90;
const ORPHAN_FILE_DAYS = 30;

function getUploadDir(): string {
  const dir = process.env.PORTAL_UPLOAD_DIR ?? "./uploads";
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

export async function runCleanup(): Promise<{
  archivedTasks: number;
  expiredTokensCleared: number;
  orphanFilesRemoved: number;
}> {
  const now = new Date();

  // 1. 만료된 reset 토큰 정리
  const expiredTokens = await prisma.portalClient.updateMany({
    where: { resetTokenExpiresAt: { lt: now } },
    data: { resetTokenHash: null, resetTokenExpiresAt: null }
  });

  // 2. 종결된 사건의 미완료 자동 알림 task → CANCELLED
  const cutoff = new Date(now.getTime() - ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const archivedTasks = await prisma.caseTask.updateMany({
    where: {
      taskType: "DEADLINE_ALERT",
      status: { in: ["TODO", "IN_PROGRESS", "OPEN", "BLOCKED"] },
      caseMatter: {
        status: { in: ["CLOSED", "CANCELLED"] },
        closedAt: { lt: cutoff }
      }
    },
    data: { status: "CANCELLED" }
  });

  // 3. 미연결 + 오래된 업로드 파일 삭제
  let orphanCount = 0;
  try {
    const dir = getUploadDir();
    const files = await readdir(dir).catch(() => []);
    const cutoffMs = now.getTime() - ORPHAN_FILE_DAYS * 24 * 60 * 60 * 1000;

    // DB에 기록된 storedPath 목록
    const tracked = new Set(
      (await prisma.portalUploadedFile.findMany({ select: { storedPath: true } })).map(
        (f) => f.storedPath
      )
    );

    for (const file of files) {
      if (tracked.has(file)) continue;
      const fullPath = path.join(dir, file);
      try {
        const st = await stat(fullPath);
        if (st.isFile() && st.mtimeMs < cutoffMs) {
          await unlink(fullPath);
          orphanCount += 1;
        }
      } catch {
        // skip
      }
    }
  } catch (error) {
    console.warn("[cleanup] orphan file scan failed", error);
  }

  return {
    archivedTasks: archivedTasks.count,
    expiredTokensCleared: expiredTokens.count,
    orphanFilesRemoved: orphanCount
  };
}
