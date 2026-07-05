import { NextResponse } from "next/server";

import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  appendChunk,
  createInquiryFromCall,
  endSession,
  loadSession,
  startSession,
  type LiveCallLanguage
} from "@/lib/services/live-transcription-service";

export const maxDuration = 60;

/**
 * Actions:
 *   { action: "start", language: "ko" | "en" }
 *   { action: "chunk", sessionId, text }
 *   { action: "end", sessionId }
 *   { action: "load", sessionId }
 *   { action: "toInquiry", sessionId, contactName, email, phone? }
 */
export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.live_transcription.save");
  const body = await safeReadJsonBody(request);
  if (!body.ok) return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
  const payload = (body.body ?? {}) as {
    action?: string;
    language?: string;
    sessionId?: string;
    text?: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };

  try {
    switch (payload.action) {
      case "start": {
        const lang: LiveCallLanguage = payload.language === "en" ? "en" : "ko";
        const session = await startSession(lang);
        return NextResponse.json({ ok: true, session });
      }
      case "chunk": {
        if (!payload.sessionId || typeof payload.text !== "string") {
          return api.error(400, "sessionId, text 필수", { code: "MISSING_CHUNK_FIELDS" });
        }
        const session = await appendChunk(payload.sessionId, payload.text);
        return NextResponse.json({ ok: true, session });
      }
      case "end": {
        if (!payload.sessionId) return api.error(400, "sessionId 필수", { code: "MISSING_SESSION_ID" });
        const session = await endSession(payload.sessionId);
        return NextResponse.json({ ok: true, session });
      }
      case "load": {
        if (!payload.sessionId) return api.error(400, "sessionId 필수", { code: "MISSING_SESSION_ID" });
        const session = await loadSession(payload.sessionId);
        if (!session) return api.error(404, "세션을 찾을 수 없습니다.", { code: "SESSION_NOT_FOUND" });
        return NextResponse.json({ ok: true, session });
      }
      case "toInquiry": {
        if (!payload.sessionId || !payload.contactName || !payload.email) {
          return api.error(400, "sessionId, contactName, email 필수", { code: "MISSING_INQUIRY_FIELDS" });
        }
        const result = await createInquiryFromCall({
          sessionId: payload.sessionId,
          contactName: payload.contactName,
          email: payload.email,
          phone: payload.phone
        });
        return NextResponse.json({ ok: true, ...result });
      }
      default:
        return api.error(400, "지원하지 않는 action.", { code: "INVALID_ACTION" });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return api.error(404, "세션을 찾을 수 없습니다.", { code: "SESSION_NOT_FOUND" });
    }
    api.logError(error);
    return api.error(500, "실시간 전사 저장 실패.", { code: "LIVE_TRANSCRIPTION_FAILED" });
  }
}
