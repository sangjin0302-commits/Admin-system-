/**
 * 관리자 로그인 — 자격증명 검증 후 세션 쿠키 발급.
 *
 * 경로가 /api/admin 이 아닌 이유: middleware가 /api/admin/* 를 Basic Auth로
 * 막기 때문에, 로그인 자체가 막히는 순환을 피하려면 별도 경로여야 한다.
 * 대신 이 라우트는 자체적으로 rate limit을 건다.
 */

import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/services/rate-limiter";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionMaxAgeSec,
  isAdminSessionConfigured
} from "@/lib/security/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KO_INVALID = "아이디 또는 비밀번호가 올바르지 않습니다.";
const KO_RATE_LIMITED = "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.";
const KO_NOT_CONFIGURED =
  "세션 로그인이 설정되지 않았습니다. ADMIN_SESSION_SECRET 또는 NEXTAUTH_SECRET을 등록해 주세요.";

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** 길이 노출을 줄이기 위한 상수시간 비교. */
function constantTimeEquals(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i += 1) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export async function POST(req: Request) {
  // 브루트포스 방어: IP당 10분에 10회.
  const rl = rateLimit(`admin-login:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: KO_RATE_LIMITED }, { status: 429 });
  }

  if (!isAdminSessionConfigured()) {
    return NextResponse.json({ ok: false, error: KO_NOT_CONFIGURED }, { status: 503 });
  }

  const expectedUser = process.env.ADMIN_BASIC_AUTH_USER?.trim();
  const expectedPassword = process.env.ADMIN_BASIC_AUTH_PASSWORD?.trim();
  if (!expectedUser || !expectedPassword) {
    return NextResponse.json({ ok: false, error: KO_NOT_CONFIGURED }, { status: 503 });
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: KO_INVALID }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const userOk = constantTimeEquals(username, expectedUser);
  const passOk = constantTimeEquals(password, expectedPassword);
  if (!userOk || !passOk) {
    return NextResponse.json({ ok: false, error: KO_INVALID }, { status: 401 });
  }

  const token = await createAdminSessionToken(username);
  if (!token) {
    return NextResponse.json({ ok: false, error: KO_NOT_CONFIGURED }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getAdminSessionMaxAgeSec()
  });
  return response;
}
