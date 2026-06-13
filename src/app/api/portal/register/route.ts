import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";

const MAX_BODY = 4 * 1024;

export async function POST(request: Request) {
  // rate limit — 가입 시도 폭주 방지
  const ip = getClientIpFromHeaders(request.headers) ?? "unknown";
  const rl = consumeRateLimit({
    namespace: "public:portal-register",
    key: ip,
    windowMs: 60 * 60 * 1000,
    max: 5
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "가입 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  const cl = request.headers.get("content-length");
  if (cl && Number(cl) > MAX_BODY) {
    return NextResponse.json({ ok: false, error: "입력이 너무 깁니다." }, { status: 413 });
  }

  let body: { email?: string; password?: string; name?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "올바른 이메일을 입력해 주세요." }, { status: 400 });
  }
  if (!name || name.length < 2) {
    return NextResponse.json({ ok: false, error: "이름을 2자 이상 입력해 주세요." }, { status: 400 });
  }
  const pw = validatePasswordStrength(password);
  if (!pw.ok) {
    return NextResponse.json({ ok: false, error: pw.reason ?? "비밀번호 형식 오류." }, { status: 400 });
  }

  // 중복 체크
  const existing = await prisma.portalClient.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  const hashed = await hashPassword(password);
  await prisma.portalClient.create({
    data: { email, hashedPassword: hashed, name, phone }
  });

  return NextResponse.json({ ok: true });
}
