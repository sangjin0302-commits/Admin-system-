import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { verifyPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(200),
});

/**
 * signin form이 호출 — 비번 1차 검증 후 2FA 필요 여부 반환.
 * 응답 그대로 신뢰하지 않음 (실제 인증은 NextAuth authorize 가 수행).
 * 단순히 UI 흐름을 "2FA 코드 입력 단계로 갈지" 결정용.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const email = parsed.data.email.toLowerCase();

  // 의뢰인 우선
  const client = await prisma.portalClient
    .findUnique({ where: { email } })
    .catch(() => null);
  if (client) {
    const ok = await verifyPassword(parsed.data.password, client.hashedPassword);
    return NextResponse.json({
      ok,
      userType: ok ? "portal" : null,
      twoFactorRequired: false,
    });
  }

  const admin = await prisma.adminUser
    .findUnique({ where: { email } })
    .catch(() => null);
  if (admin && admin.active && admin.passwordHash) {
    const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
    return NextResponse.json({
      ok,
      userType: ok ? "admin" : null,
      twoFactorRequired: ok && !!admin.totpSecret,
    });
  }

  return NextResponse.json({ ok: false });
}
