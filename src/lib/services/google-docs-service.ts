/**
 * Google Docs — 제목 + 본문으로 문서 생성, 선택 시 Drive 폴더로 이동.
 *
 * 기존 서비스들과 같은 규칙: getValidAccessToken 으로 토큰 확보(없으면 null),
 * raw fetch, throw 금지.
 *
 * Docs API: https://developers.google.com/docs/api/reference/rest
 */

import { getValidAccessToken } from "@/lib/services/google-oauth-service";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

const DOCS_BASE = "https://docs.googleapis.com/v1";
const DRIVE_BASE = "https://www.googleapis.com/drive/v3";

/**
 * 문서를 만들고 본문을 삽입한다. folderId 가 있으면 해당 폴더로 이동.
 * 실패·미연결 시 null.
 */
export async function createDoc(params: {
  title: string;
  bodyText: string;
  folderId?: string;
  userId?: string;
}): Promise<{ documentId: string; url: string } | null> {
  const token = await getValidAccessToken(params.userId);
  if (!token) {
    logger.warn("[google-docs] createDoc: no token (미연결)");
    return null;
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    // 1) 빈 문서 생성
    const createRes = await fetch(`${DOCS_BASE}/documents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title: params.title }),
    });
    if (!createRes.ok) {
      logger.warn("[google-docs] document create failed", createRes.status);
      return null;
    }
    const created = (await createRes.json()) as { documentId?: string };
    const documentId = created.documentId;
    if (!documentId) return null;

    // 2) 본문 삽입 (index 1 = 문서 시작)
    if (params.bodyText) {
      const updateRes = await fetch(`${DOCS_BASE}/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          requests: [
            { insertText: { location: { index: 1 }, text: params.bodyText } },
          ],
        }),
      });
      if (!updateRes.ok) {
        logger.warn("[google-docs] batchUpdate failed", updateRes.status);
        // 문서 자체는 만들어졌으므로 계속 진행
      }
    }

    // 3) 폴더 이동 (drive.file 스코프로 같은 토큰 사용)
    if (params.folderId) {
      const moveUrl =
        `${DRIVE_BASE}/files/${documentId}?` +
        new URLSearchParams({
          addParents: params.folderId,
          removeParents: "root",
          fields: "id",
        }).toString();
      const moveRes = await fetch(moveUrl, { method: "PATCH", headers });
      if (!moveRes.ok) {
        logger.warn("[google-docs] move to folder failed", moveRes.status);
        // 이동 실패해도 문서 URL 은 유효
      }
    }

    return {
      documentId,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      scope: "google-docs:createDoc",
      title: params.title,
    });
    return null;
  }
}
