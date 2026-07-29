/**
 * Google Sheets — 헤더 + 행 데이터로 스프레드시트 생성(사건대장 등 내보내기).
 *
 * 기존 Docs/Drive 서비스와 같은 규칙: getValidAccessToken 으로 토큰 확보(없으면 null),
 * raw fetch, throw 금지.
 *
 * 스코프 spreadsheets 필요 — 추가 후 재연결(재동의) 해야 반영.
 * Sheets API: https://developers.google.com/sheets/api/reference/rest
 */

import { getValidAccessToken } from "@/lib/services/google-oauth-service";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_BASE = "https://www.googleapis.com/drive/v3";

/**
 * 스프레드시트를 만들고 헤더+행을 채운다. folderId 있으면 해당 폴더로 이동.
 * 실패·미연결 시 null.
 */
export async function exportRowsToSheet(params: {
  title: string;
  headers: string[];
  rows: (string | number | null)[][];
  folderId?: string;
  userId?: string;
}): Promise<{ spreadsheetId: string; url: string } | null> {
  const token = await getValidAccessToken(params.userId);
  if (!token) {
    logger.warn("[google-sheets] exportRowsToSheet: no token (미연결)");
    return null;
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  try {
    // 1) 빈 스프레드시트 생성
    const createRes = await fetch(SHEETS_BASE, {
      method: "POST",
      headers,
      body: JSON.stringify({ properties: { title: params.title } })
    });
    if (!createRes.ok) {
      logger.warn("[google-sheets] spreadsheet create failed", createRes.status);
      return null;
    }
    const created = (await createRes.json()) as {
      spreadsheetId?: string;
      spreadsheetUrl?: string;
      sheets?: { properties?: { title?: string } }[];
    };
    const spreadsheetId = created.spreadsheetId;
    if (!spreadsheetId) return null;
    const sheetName = created.sheets?.[0]?.properties?.title ?? "Sheet1";

    // 2) 값 채우기 (헤더 + 행)
    const values = [params.headers, ...params.rows.map((r) => r.map((c) => (c == null ? "" : c)))];
    const range = encodeURIComponent(`${sheetName}!A1`);
    const valuesRes = await fetch(
      `${SHEETS_BASE}/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      { method: "PUT", headers, body: JSON.stringify({ values }) }
    );
    if (!valuesRes.ok) {
      logger.warn("[google-sheets] values update failed", valuesRes.status);
      // 시트 자체는 생성됐으므로 URL 은 유효
    }

    // 3) 폴더 이동 (drive.file 스코프로 같은 토큰 사용) — 선택
    if (params.folderId) {
      const moveUrl =
        `${DRIVE_BASE}/files/${spreadsheetId}?` +
        new URLSearchParams({
          addParents: params.folderId,
          removeParents: "root",
          fields: "id"
        }).toString();
      const moveRes = await fetch(moveUrl, { method: "PATCH", headers });
      if (!moveRes.ok) {
        logger.warn("[google-sheets] move to folder failed", moveRes.status);
      }
    }

    return {
      spreadsheetId,
      url: created.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      scope: "google-sheets:exportRowsToSheet",
      title: params.title
    });
    return null;
  }
}
