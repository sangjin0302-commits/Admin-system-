/**
 * AI 음성 상담 서비스.
 *
 * OpenAI Realtime API 또는 ElevenLabs + Whisper를 사용한 실시간 음성 대화.
 * 두 프로바이더 모두 미설정이면 텍스트 기반 fallback으로 자동 강등됩니다.
 *
 * 세션 등록: 인메모리 (짧게 유지) — 프로덕션에서는 Redis 권장.
 */

import { randomBytes } from "node:crypto";

export type VoiceProvider = "openai_realtime" | "elevenlabs" | "text_fallback";

export type VoiceSessionConfig = {
  /** 방문자 IP 또는 anonymous id (레이트 제한용) */
  visitorId: string;
  /** 상담 주제 힌트 (선택) */
  topic?: string;
  /** 최대 세션 지속 시간(초) */
  maxDurationSec?: number;
};

export type VoiceSessionHandle = {
  sessionId: string;
  provider: VoiceProvider;
  /** 클라이언트가 음성 스트림을 연결할 엔드포인트 */
  streamUrl: string;
  /** WebRTC 또는 WS 인증 토큰 (짧은 TTL) */
  token: string;
  /** 세션 만료 timestamp (ms) */
  expiresAt: number;
  /** provider가 realtime이 아닐 때 텍스트 fallback 안내 */
  textFallbackReason?: string;
};

type StoredSession = VoiceSessionHandle & { visitorId: string; startedAt: number };

const SESSIONS = new Map<string, StoredSession>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 3; // 분당 방문자당 3세션
const RATE_TRACKER = new Map<string, number[]>();

const DEFAULT_MAX_DURATION_SEC = 300; // 5분

export function pickProvider(): VoiceProvider {
  if (process.env.OPENAI_REALTIME_API_KEY) return "openai_realtime";
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  return "text_fallback";
}

function checkRateLimit(visitorId: string): boolean {
  const now = Date.now();
  const arr = RATE_TRACKER.get(visitorId) ?? [];
  const kept = arr.filter((t) => now - t < RATE_WINDOW_MS);
  if (kept.length >= RATE_MAX) {
    RATE_TRACKER.set(visitorId, kept);
    return false;
  }
  kept.push(now);
  RATE_TRACKER.set(visitorId, kept);
  return true;
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [id, s] of SESSIONS.entries()) {
    if (s.expiresAt < now) SESSIONS.delete(id);
  }
}

/** 새 음성 세션 시작. 레이트 초과 시 null. */
export function startVoiceSession(config: VoiceSessionConfig): VoiceSessionHandle | null {
  if (!checkRateLimit(config.visitorId)) return null;
  pruneExpired();

  const provider = pickProvider();
  const sessionId = randomBytes(12).toString("hex");
  const token = randomBytes(24).toString("hex");
  const maxSec = config.maxDurationSec ?? DEFAULT_MAX_DURATION_SEC;
  const expiresAt = Date.now() + maxSec * 1000;

  let streamUrl = "";
  let textFallbackReason: string | undefined;
  switch (provider) {
    case "openai_realtime":
      streamUrl = `/api/public/voice-consult/stream?sid=${sessionId}`;
      break;
    case "elevenlabs":
      streamUrl = `/api/public/voice-consult/stream?sid=${sessionId}&p=el`;
      break;
    case "text_fallback":
      streamUrl = `/api/public/voice-consult/text?sid=${sessionId}`;
      textFallbackReason = "음성 프로바이더 미설정 — 텍스트 상담으로 대체합니다";
      break;
  }

  const handle: VoiceSessionHandle = {
    sessionId,
    provider,
    streamUrl,
    token,
    expiresAt,
    textFallbackReason,
  };
  SESSIONS.set(sessionId, { ...handle, visitorId: config.visitorId, startedAt: Date.now() });
  return handle;
}

export function getVoiceSession(sessionId: string): VoiceSessionHandle | null {
  pruneExpired();
  return SESSIONS.get(sessionId) ?? null;
}

export function endVoiceSession(sessionId: string): void {
  SESSIONS.delete(sessionId);
}
