import { NextResponse } from "next/server";

import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { hashResetToken } from "@/lib/auth/reset-token";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
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
