/**
 * Google OAuth 2.0 — Calendar API access token store + refresh.
 *
 * 필요 환경변수:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI   (예: https://<host>/api/auth/google/callback)
 *
 * 토큰은 GoogleOAuthToken 모델에 영속화. userId는 NextAuth 세션의 admin 식별자
 * (현재는 'default-admin' 고정 — 다중 사용자 도입 시 세션에서 추출).
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

const GOOGLE_OAUTH_BASE = "https://oauth2.googleapis.com";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// Calendar + Drive(앱 생성 파일 한정) + Docs 를 한 번의 동의로 요청.
// drive.file 은 이 앱이 만든 파일만 접근 — 의뢰인 PII 보호에 더 안전(전체 drive 스코프 아님).
const SCOPE = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");
const DEFAULT_USER_ID = "default-admin";

function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function isGoogleOAuthConfigured(): boolean {
  return getConfig() !== null;
}

export function buildAuthorizeUrl(state: string): string | null {
  const cfg = getConfig();
  if (!cfg) return null;
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: SCOPE,
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface TokenExchange {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

export async function exchangeCodeForToken(code: string): Promise<TokenExchange | null> {
  const cfg = getConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${GOOGLE_OAUTH_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: cfg.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      logger.error("[google-oauth] token exchange failed", res.status, body);
      return null;
    }
    return (await res.json()) as TokenExchange;
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)));
    return null;
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenExchange | null> {
  const cfg = getConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${GOOGLE_OAUTH_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      logger.error("[google-oauth] refresh failed", res.status, body);
      return null;
    }
    const data = (await res.json()) as TokenExchange;
    return { ...data, refresh_token: data.refresh_token ?? refreshToken };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)));
    return null;
  }
}

// ---------------------------------------------------------------------------
// Token store
// ---------------------------------------------------------------------------

export async function storeToken(params: {
  userId?: string;
  orgId?: string;
  token: TokenExchange;
  calendarId?: string;
}): Promise<void> {
  const userId = params.userId ?? DEFAULT_USER_ID;
  const expiresAt = new Date(Date.now() + params.token.expires_in * 1000 - 30_000);

  await prisma.googleOAuthToken.upsert({
    where: { userId },
    create: {
      userId,
      orgId: params.orgId,
      accessToken: params.token.access_token,
      refreshToken: params.token.refresh_token ?? "",
      expiresAt,
      scope: params.token.scope,
      calendarId: params.calendarId ?? "primary",
    },
    update: {
      accessToken: params.token.access_token,
      refreshToken: params.token.refresh_token ?? undefined,
      expiresAt,
      scope: params.token.scope,
    },
  });
}

/**
 * 유효한 access token 반환. 만료되었거나 임박했으면 자동 refresh.
 */
export async function getValidAccessToken(userId: string = DEFAULT_USER_ID): Promise<string | null> {
  const row = await prisma.googleOAuthToken.findUnique({ where: { userId } }).catch(() => null);
  if (!row) return null;

  if (row.expiresAt.getTime() > Date.now()) return row.accessToken;

  if (!row.refreshToken) return null;
  const refreshed = await refreshAccessToken(row.refreshToken);
  if (!refreshed) return null;

  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000 - 30_000);
  await prisma.googleOAuthToken.update({
    where: { userId },
    data: {
      accessToken: refreshed.access_token,
      expiresAt,
      refreshToken: refreshed.refresh_token ?? row.refreshToken,
    },
  });
  return refreshed.access_token;
}

export async function revokeToken(userId: string = DEFAULT_USER_ID): Promise<boolean> {
  const row = await prisma.googleOAuthToken.findUnique({ where: { userId } }).catch(() => null);
  if (!row) return false;
  try {
    await fetch(`${GOOGLE_OAUTH_BASE}/revoke?token=${encodeURIComponent(row.refreshToken)}`, {
      method: "POST",
    });
  } catch {
    // best-effort
  }
  await prisma.googleOAuthToken.delete({ where: { userId } }).catch(() => undefined);
  return true;
}

export async function getConnectionStatus(userId: string = DEFAULT_USER_ID) {
  if (!isGoogleOAuthConfigured()) {
    return { configured: false, connected: false } as const;
  }
  const row = await prisma.googleOAuthToken
    .findUnique({ where: { userId }, select: { lastSyncedAt: true, calendarId: true } })
    .catch(() => null);
  return {
    configured: true,
    connected: row !== null,
    lastSyncedAt: row?.lastSyncedAt ?? null,
    calendarId: row?.calendarId ?? null,
  } as const;
}
