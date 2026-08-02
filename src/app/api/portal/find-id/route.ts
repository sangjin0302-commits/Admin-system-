import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { maskEmail } from "@/lib/auth/mask-email";
import { samePhone } from "@/lib/auth/phone-match";

/**
 * 아이디(가입 이메일) 찾기 — 이름 + 전화번호로 조회해 **마스킹된** 이메일만 반환.
 *
 * 보안:
 *  - IP rate-limit(시간당 10회).
 *  - 이름·전화 모두 일치할 때만 매칭(전화만으론 열람 불가).
 *  - 전체 이메일은 절대 반환하지 않고 부분 마스킹(예: at****@gmail.com).
 */
export async function POST(request: Request) {
  const ip = getClientIpFromHeaders(request.headers) ?? "unknown";
  const rl = consumeRateLimit({
    namespace: "public:find-id",
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

  let body: { name?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const phoneDigits = (body.phone ?? "").replace(/\D/g, "");

  // 입력이 불충분하면 조용히 "없음"(존재 여부 노출 방지).
  if (name.length < 1 || phoneDigits.length < 9) {
    return NextResponse.json({ ok: true, found: false });
  }

  // 이름 일치 후보만(상한). name 인덱스는 없으나 법무사무소 회원 수 소규모 → take로 상한.
  const candidates = await prisma.portalClient.findMany({
    where: { name },
    select: { email: true, phone: true },
    take: 50
  });
  // 전화는 국가코드·형식 차이를 흡수해 뒤 8자리로 비교(phone-match).
  const match = candidates.find((c) => samePhone(c.phone, body.phone));

  if (!match) {
    return NextResponse.json({ ok: true, found: false });
  }
  return NextResponse.json({ ok: true, found: true, email: maskEmail(match.email) });
}
