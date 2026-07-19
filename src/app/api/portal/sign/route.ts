import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { getPortalUser } from "@/lib/security/portal-auth";
import { logger } from "@/lib/utils/logger";

/**
 * 전자서명 확정.
 *
 * 예전에는 인증이 전혀 없어서, documentId 만 알면(또는 찍어 맞히면) 누구나 남의
 * 법적 문서를 SIGNED 로 바꿀 수 있었다. 이제 둘 중 하나를 반드시 통과해야 한다.
 *
 *   1) 로그인 세션의 이메일이 signerEmail 과 일치      (포털에서 서명)
 *   2) 요청의 token 이 signRequest.internalToken 과 일치 (메일로 받은 서명 링크)
 *
 * 2번은 스키마가 원래 의도한 경로다(`internalToken … 클릭검증용`). 필드만 있고
 * 검증하는 곳이 없어 사실상 무방비였다.
 */

/** 타이밍 공격 방지용 — 길이가 달라도 일정 시간에 끝난다. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { documentId, signatureDataUrl, signerName, token } = body as {
      documentId?: string;
      signatureDataUrl?: string;
      signerName?: string;
      token?: string;
    };

    if (!documentId || !signatureDataUrl || !signerName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const signRequest = await prisma.eSignRequest.findFirst({ where: { id: documentId } });
    if (!signRequest) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // ── 권한 확인 ──
    const user = await getPortalUser();
    const sessionMatches =
      !!user && user.email.trim().toLowerCase() === signRequest.signerEmail.trim().toLowerCase();
    const tokenMatches =
      typeof token === "string" &&
      token.length > 0 &&
      constantTimeEquals(token, signRequest.internalToken);

    if (!sessionMatches && !tokenMatches) {
      // 문서 존재 여부를 숨기기 위해 404 가 아니라 403 으로 통일하지 않는다 —
      // 위에서 이미 404 를 반환했으므로 여기서는 권한 부족이 맞다.
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 상태 확인 ──
    if (signRequest.status === "SIGNED") {
      return NextResponse.json(
        { error: "이미 서명이 완료된 문서입니다.", signedAt: signRequest.signedAt },
        { status: 409 }
      );
    }
    if (signRequest.expiresAt && signRequest.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "서명 기한이 지났습니다." }, { status: 410 });
    }

    const signedAt = new Date();
    await prisma.eSignRequest.update({
      where: { id: documentId },
      data: { status: "SIGNED", signedAt },
    });

    // NOTE: signatureDataUrl(서명 이미지)을 보관할 컬럼이 ESignRequest 에 없어
    // 현재는 저장되지 않는다. 서명 원본 보관이 필요하면 스키마 추가가 선행돼야 한다.
    logger.info("[sign] document signed", {
      documentId,
      signerName,
      via: sessionMatches ? "session" : "token",
    });

    return NextResponse.json({ success: true, signedAt: signedAt.toISOString() });
  } catch (err) {
    logger.warn("[sign] error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
