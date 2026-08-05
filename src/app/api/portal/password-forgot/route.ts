import { NextResponse } from "next/server";

import { generateResetToken } from "@/lib/auth/reset-token";
import { prisma } from "@/lib/prisma/client";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { sendClientNotification } from "@/lib/services/client-notifications";
import { logger } from "@/lib/utils/logger";

export async function POST(request: Request) {
  // 이메일 기준 rate-limit
  const ip = getClientIpFromHeaders(request.headers) ?? "unknown";
  const rl = consumeRateLimit({
    namespace: "public:password-forgot",
    key: ip,
    windowMs: 60 * 60 * 1000,
    max: 10
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // 보안: 존재 여부 노출 X → 항상 ok 반환
    return NextResponse.json({ ok: true });
  }

  const client = await prisma.portalClient.findUnique({ where: { email } });
  if (client) {
    const { rawToken, tokenHash, expiresAt } = generateResetToken();
    await prisma.portalClient.update({
      where: { id: client.id },
      data: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt }
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
    const resetUrl = `${baseUrl}/portal/reset?token=${rawToken}`;

    await sendClientNotification({
      event: "password_reset",
      toEmail: email,
      toName: client.name,
      variables: { resetUrl }
    });

    // 재설정 토큰은 로그에 남기지 않는다(로그 접근 시 계정탈취 방지). 발급 사실만 기록.
    logger.debug("[password-forgot] reset link generated for client", client.id);
  }

  return NextResponse.json({ ok: true });
}
