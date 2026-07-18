/**
 * 관리자 세션 쿠키 (로그인 폼용).
 *
 * 기존 Basic Auth를 대체하지 않고 "추가"한다. middleware는 세션 쿠키 또는
 * Basic Auth 중 하나만 통과하면 인가하므로, 세션 설정이 없거나 깨져도
 * 기존 Basic Auth로 계속 들어갈 수 있다(잠김 방지).
 *
 * 서명 비밀키: ADMIN_SESSION_SECRET → 없으면 NEXTAUTH_SECRET.
 * 둘 다 없으면 세션 로그인 비활성(= Basic Auth만 동작).
 *
 * jose를 쓰는 이유: middleware는 Edge 런타임이라 node:crypto를 못 쓴다.
 */

import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "admin_session";

/** 기본 만료 12시간. ADMIN_SESSION_MAX_AGE_SEC 로 조정 가능. */
export function getAdminSessionMaxAgeSec(): number {
  const raw = Number(process.env.ADMIN_SESSION_MAX_AGE_SEC);
  if (!Number.isFinite(raw)) return 12 * 60 * 60;
  return Math.min(Math.max(Math.trunc(raw), 5 * 60), 7 * 24 * 60 * 60);
}

function getSecretKey(): Uint8Array | null {
  const raw =
    process.env.ADMIN_SESSION_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (!raw) return null;
  return new TextEncoder().encode(raw);
}

export function isAdminSessionConfigured(): boolean {
  return getSecretKey() !== null;
}

export async function createAdminSessionToken(username: string): Promise<string | null> {
  const key = getSecretKey();
  if (!key) return null;

  const maxAge = getAdminSessionMaxAgeSec();
  return new SignJWT({ sub: username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("ethos-admin")
    .setAudience("ethos-admin")
    .setExpirationTime(`${maxAge}s`)
    .sign(key);
}

/** 유효하면 username 반환, 아니면 null. */
export async function verifyAdminSessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const key = getSecretKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: "ethos-admin",
      audience: "ethos-admin",
      algorithms: ["HS256"]
    });
    if (payload.role !== "admin") return null;
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
