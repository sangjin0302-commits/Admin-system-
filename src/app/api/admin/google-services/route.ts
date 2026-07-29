/**
 * Google 서비스(Drive · Docs · Meet) 연동 관리 API.
 *
 * 기존 Google OAuth 토큰 플로우를 확장 — 별도 npm 패키지 없이 raw fetch 사용.
 *
 * 인증: integration-diagnostics 와 동일 (관리자 세션 쿠키 / Bearer CRON_SECRET / Basic).
 *
 *   GET  /api/admin/google-services  → 연결 상태 + 부여된 스코프(calendar/drive/docs)
 *   POST /api/admin/google-services  → { action } 로 연결/해제/테스트
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/security/admin-session";
import { prisma } from "@/lib/prisma/client";
import {
  buildAuthorizeUrl,
  getConnectionStatus,
  revokeToken,
} from "@/lib/services/google-oauth-service";
import { getOrCreateCaseFolder, uploadFile } from "@/lib/services/google-drive-service";
import { createDoc } from "@/lib/services/google-docs-service";
import { createCalendarEventWithMeet } from "@/lib/services/google-calendar-sync-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_USER_ID = "default-admin";

/**
 * /api/admin/* 는 middleware 가 이미 막는다. 여기까지 온 요청은 통과한 것.
 * 자동화(cron·스크립트)용 Bearer CRON_SECRET 및 구 방식 Basic 도 허용.
 */
async function authorized(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  if (secret && auth === `Bearer ${secret}`) return true;
  if (auth.startsWith("Basic ")) return true;
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return (await verifyAdminSessionToken(token)) !== null;
}

/** 저장된 토큰의 scope 문자열 → 서비스별 boolean. */
function scopesFrom(scope: string | null | undefined) {
  const s = scope ?? "";
  return {
    calendar: s.includes("https://www.googleapis.com/auth/calendar"),
    drive: s.includes("https://www.googleapis.com/auth/drive.file"),
    docs: s.includes("https://www.googleapis.com/auth/documents"),
    sheets: s.includes("https://www.googleapis.com/auth/spreadsheets"),
  };
}

export async function GET(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const status = await getConnectionStatus();
  const row = await prisma.googleOAuthToken
    .findUnique({ where: { userId: DEFAULT_USER_ID }, select: { scope: true } })
    .catch(() => null);

  return NextResponse.json({
    ok: true,
    configured: status.configured,
    connected: status.connected,
    scopes: scopesFrom(row?.scope),
  });
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    nowIso?: string;
  };
  const action = body.action;

  switch (action) {
    case "connect-url": {
      const url = buildAuthorizeUrl("google-services");
      if (!url) {
        return NextResponse.json({ ok: false, error: "not_configured" });
      }
      return NextResponse.json({ ok: true, url });
    }

    case "disconnect": {
      await revokeToken();
      return NextResponse.json({ ok: true });
    }

    case "test-drive": {
      const folder = await getOrCreateCaseFolder("_연결테스트");
      if (!folder) {
        return NextResponse.json({ ok: false, error: "not_connected_or_failed" });
      }
      const file = await uploadFile({
        name: "connection-test.txt",
        mimeType: "text/plain",
        data: "ETHOS Drive 연결 테스트",
        folderId: folder.folderId,
      });
      if (!file) {
        return NextResponse.json({ ok: false, error: "not_connected_or_failed" });
      }
      return NextResponse.json({
        ok: true,
        folder: { id: folder.folderId, webViewLink: folder.webViewLink },
        file: { id: file.id, webViewLink: file.webViewLink },
      });
    }

    case "test-docs": {
      const doc = await createDoc({
        title: "ETHOS 연결 테스트 문서",
        bodyText: "이 문서는 Google Docs 연동 확인용입니다.",
      });
      if (!doc) {
        return NextResponse.json({ ok: false, error: "not_connected_or_failed" });
      }
      return NextResponse.json({ ok: true, documentId: doc.documentId, url: doc.url });
    }

    case "test-sheets": {
      const { exportRowsToSheet } = await import("@/lib/services/google-sheets-service");
      const sheet = await exportRowsToSheet({
        title: "ETHOS 연결 테스트 시트",
        headers: ["항목", "값"],
        rows: [["연동", "정상"], ["작성", "연결 테스트"]],
      });
      if (!sheet) {
        return NextResponse.json({ ok: false, error: "not_connected_or_failed" });
      }
      return NextResponse.json({ ok: true, spreadsheetId: sheet.spreadsheetId, url: sheet.url });
    }

    case "test-meet": {
      // 기준 시각: 요청 본문 nowIso 있으면 사용, 없으면 현재.
      const base = body.nowIso ? new Date(body.nowIso) : new Date();
      const start = new Date(base);
      start.setDate(start.getDate() + 1);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start.getTime() + 30 * 60_000);

      const meet = await createCalendarEventWithMeet({
        summary: "ETHOS 연결 테스트 상담",
        description: "Google Meet 연동 확인용 이벤트입니다.",
        start,
        end,
      });
      if (!meet) {
        return NextResponse.json({ ok: false, error: "not_connected_or_failed" });
      }
      return NextResponse.json({
        ok: true,
        eventId: meet.eventId,
        htmlLink: meet.htmlLink,
        meetLink: meet.meetLink,
      });
    }

    default:
      return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  }
}
