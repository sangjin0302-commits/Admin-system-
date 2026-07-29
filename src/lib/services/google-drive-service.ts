/**
 * Google Drive — 사건 자료 폴더 관리 + 파일 업로드.
 *
 * 기존 google-calendar-sync-service 와 같은 패턴:
 *   1) getValidAccessToken(userId) 로 토큰 확보 (없으면 null 반환, throw 안 함)
 *   2) raw fetch 로 Drive REST 호출
 *
 * 스코프는 drive.file (이 앱이 만든 파일만) — 의뢰인 PII 보호 목적.
 * Drive API: https://developers.google.com/drive/api/v3/reference
 */

import { getValidAccessToken } from "@/lib/services/google-oauth-service";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

const DRIVE_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

const ROOT_FOLDER_NAME = "ETHOS 사건자료";
const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface DriveEntry {
  id: string;
  webViewLink?: string;
}

/** q 필터의 문자열 값에 든 작은따옴표 이스케이프. */
function escapeQuery(value: string): string {
  return value.replace(/'/g, "\\'");
}

/**
 * 이름(+선택 부모)으로 폴더를 찾고, 없으면 생성해서 반환.
 * 실패·미연결 시 null.
 */
export async function ensureFolder(
  name: string,
  parentId?: string,
  userId?: string
): Promise<DriveEntry | null> {
  const token = await getValidAccessToken(userId);
  if (!token) {
    logger.warn("[google-drive] ensureFolder: no token (미연결)");
    return null;
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    // 1) 검색
    const clauses = [
      `mimeType='${FOLDER_MIME}'`,
      `name='${escapeQuery(name)}'`,
      "trashed=false",
    ];
    if (parentId) clauses.push(`'${escapeQuery(parentId)}' in parents`);
    const q = clauses.join(" and ");
    const listUrl =
      `${DRIVE_BASE}/files?` +
      new URLSearchParams({
        q,
        fields: "files(id,webViewLink)",
        pageSize: "1",
        spaces: "drive",
      }).toString();

    const listRes = await fetch(listUrl, { headers });
    if (listRes.ok) {
      const data = (await listRes.json()) as { files?: DriveEntry[] };
      const found = data.files?.[0];
      if (found?.id) return { id: found.id, webViewLink: found.webViewLink };
    } else {
      logger.warn("[google-drive] folder list failed", listRes.status);
    }

    // 2) 생성
    const createRes = await fetch(`${DRIVE_BASE}/files?fields=id,webViewLink`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME,
        parents: parentId ? [parentId] : undefined,
      }),
    });
    if (!createRes.ok) {
      logger.warn("[google-drive] folder create failed", createRes.status);
      return null;
    }
    const created = (await createRes.json()) as DriveEntry;
    return created.id ? { id: created.id, webViewLink: created.webViewLink } : null;
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      scope: "google-drive:ensureFolder",
      name,
    });
    return null;
  }
}

/**
 * "ETHOS 사건자료" 루트 하위에 caseLabel 서브폴더를 확보하고 반환.
 */
export async function getOrCreateCaseFolder(
  caseLabel: string,
  userId?: string
): Promise<{ folderId: string; webViewLink?: string } | null> {
  const root = await ensureFolder(ROOT_FOLDER_NAME, undefined, userId);
  if (!root) return null;
  const sub = await ensureFolder(caseLabel, root.id, userId);
  if (!sub) return null;
  return { folderId: sub.id, webViewLink: sub.webViewLink };
}

/**
 * 멀티파트 업로드로 파일을 Drive 에 올린다.
 * 실패·미연결 시 null.
 */
export async function uploadFile(params: {
  name: string;
  mimeType: string;
  data: string | Buffer;
  folderId?: string;
  userId?: string;
}): Promise<DriveEntry | null> {
  const token = await getValidAccessToken(params.userId);
  if (!token) {
    logger.warn("[google-drive] uploadFile: no token (미연결)");
    return null;
  }

  try {
    const boundary = "ethos-boundary-drive-upload";
    const metadata = {
      name: params.name,
      parents: params.folderId ? [params.folderId] : undefined,
    };
    const mediaBuffer = Buffer.isBuffer(params.data)
      ? params.data
      : Buffer.from(params.data, "utf-8");

    // 멀티파트 본문 수동 구성: 메타데이터 파트 + 미디어 파트.
    const preamble =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${params.mimeType}\r\n\r\n`;
    const epilogue = `\r\n--${boundary}--`;

    const body = Buffer.concat([
      Buffer.from(preamble, "utf-8"),
      mediaBuffer,
      Buffer.from(epilogue, "utf-8"),
    ]);

    const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id,webViewLink`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    if (!res.ok) {
      logger.warn("[google-drive] uploadFile failed", res.status);
      return null;
    }
    const uploaded = (await res.json()) as DriveEntry;
    return uploaded.id ? { id: uploaded.id, webViewLink: uploaded.webViewLink } : null;
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      scope: "google-drive:uploadFile",
      name: params.name,
    });
    return null;
  }
}
