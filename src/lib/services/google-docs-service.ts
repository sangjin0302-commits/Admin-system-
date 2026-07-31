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

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/**
 * 템플릿 문서를 복사 → 플레이스홀더({{키}})를 값으로 치환 → 선택 폴더로 이동.
 * 관리자가 서식 Google Doc 을 만들어 등록하면 여기서 복사본을 찍어낸다.
 * 실패·미연결 시 null.
 */
export async function generateFromTemplate(params: {
  templateDocId: string;
  title: string;
  replacements: Record<string, string>;
  folderId?: string;
  userId?: string;
}): Promise<{ documentId: string; url: string } | null> {
  const token = await getValidAccessToken(params.userId);
  if (!token) {
    logger.warn("[google-docs] generateFromTemplate: no token (미연결)");
    return null;
  }
  const headers = authHeaders(token);

  try {
    // 1) 템플릿 복사 (Drive files.copy)
    const copyRes = await fetch(
      `${DRIVE_BASE}/files/${params.templateDocId}/copy?fields=id`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: params.title,
          parents: params.folderId ? [params.folderId] : undefined,
        }),
      }
    );
    if (!copyRes.ok) {
      logger.warn("[google-docs] template copy failed", copyRes.status);
      return null;
    }
    const copied = (await copyRes.json()) as { id?: string };
    const documentId = copied.id;
    if (!documentId) return null;

    // 2) 플레이스홀더 치환 (replaceAllText 일괄)
    const requests = Object.entries(params.replacements).map(([key, value]) => ({
      replaceAllText: {
        containsText: { text: `{{${key}}}`, matchCase: false },
        replaceText: value ?? "",
      },
    }));
    if (requests.length > 0) {
      const updRes = await fetch(`${DOCS_BASE}/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ requests }),
      });
      if (!updRes.ok) {
        logger.warn("[google-docs] template replace failed", updRes.status);
        // 복사본은 유효 — URL 반환
      }
    }

    return {
      documentId,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      scope: "google-docs:generateFromTemplate",
      templateDocId: params.templateDocId,
    });
    return null;
  }
}

/**
 * 문서(또는 스프레드시트 등 Google 파일)를 지정 형식으로 내보낸 바이트를 반환.
 * 기본 PDF. 실패·미연결 시 null.
 */
export async function exportFile(params: {
  fileId: string;
  mimeType?: string;
  userId?: string;
}): Promise<{ data: Buffer; mimeType: string } | null> {
  const token = await getValidAccessToken(params.userId);
  if (!token) {
    logger.warn("[google-docs] exportFile: no token (미연결)");
    return null;
  }
  const mimeType = params.mimeType ?? "application/pdf";
  try {
    const url =
      `${DRIVE_BASE}/files/${params.fileId}/export?` +
      new URLSearchParams({ mimeType }).toString();
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      logger.warn("[google-docs] export failed", res.status);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return { data: buf, mimeType };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      scope: "google-docs:exportFile",
      fileId: params.fileId,
    });
    return null;
  }
}

/** 문서에서 {{placeholder}} 목록을 추출한다(등록 시 변수 미리보기용). */
export async function extractPlaceholders(params: {
  documentId: string;
  userId?: string;
}): Promise<string[] | null> {
  const token = await getValidAccessToken(params.userId);
  if (!token) return null;
  try {
    const res = await fetch(`${DOCS_BASE}/documents/${params.documentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      logger.warn("[google-docs] fetch doc for placeholders failed", res.status);
      return null;
    }
    const doc = (await res.json()) as {
      body?: { content?: Array<{ paragraph?: { elements?: Array<{ textRun?: { content?: string } }> } }> };
    };
    let text = "";
    for (const el of doc.body?.content ?? []) {
      for (const pe of el.paragraph?.elements ?? []) {
        text += pe.textRun?.content ?? "";
      }
    }
    const found = new Set<string>();
    for (const m of text.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) {
      found.add(m[1].trim());
    }
    return [...found];
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      scope: "google-docs:extractPlaceholders",
      documentId: params.documentId,
    });
    return null;
  }
}

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
