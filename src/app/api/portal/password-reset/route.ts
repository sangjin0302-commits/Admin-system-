import { NextResponse } from "next/server";

import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { hashResetToken } from "@/lib/auth/reset-token";
import { prisma } from "@/lib/prisma/client";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  // 토큰 추측 방지 — IP 기준 rate-limit.
  const ip = getClientIpFromHeaders(request.headers) ?? "unknown";
  const rl = consumeRateLimit({
    namespace: "public:password-reset",
    key: ip,
    windowMs: 60 * 60 * 1000,
    max: 20
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const rawToken = (body.token ?? "").trim();
  const password = body.password ?? "";
  if (!rawToken) {
    return NextResponse.json({ ok: false, error: "토큰이 누락되었습니다." }, { status: 400 });
  }

  const pw = validatePasswordStrength(password);
  if (!pw.ok) {
    return NextResponse.json({ ok: false, error: pw.reason ?? "비밀번호 형식 오류." }, { status: 400 });
  }

  const tokenHash = hashResetToken(rawToken);
  const client = await prisma.portalClient.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { gt: new Date() }
    }
  });

  if (!client) {
    return NextResponse.json(
      { ok: false, error: "토큰이 만료되었거나 유효하지 않습니다." },
      { status: 400 }
    );
  }

  const hashed = await hashPassword(password);
  await prisma.portalClient.update({
    where: { id: client.id },
    data: {
      hashedPassword: hashed,
      resetTokenHash: null,
      resetTokenExpiresAt: null
    }
  });

  return NextResponse.json({ ok: true });
}
