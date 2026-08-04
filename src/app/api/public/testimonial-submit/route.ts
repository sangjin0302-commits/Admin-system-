import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

/**
 * 고객 후기 제출 — 승인제. published:false 로 저장(숨김) → 관리자가 /admin/testimonials
 * 에서 검토 후 공개(published:true). 신규 제출 시 텔레그램 알림.
 */
const CATEGORIES = new Set(["VISA_STAY", "ADMIN_APPEAL", "CONTRACT_INVESTIGATION", "LICENSE_PERMIT"]);

export async function POST(req: Request) {
  const ip = getClientIpFromHeaders(req.headers) ?? "unknown";
  const rl = consumeRateLimit({ namespace: "public:testimonial", key: ip, max: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  let body: { quote?: string; author?: string; category?: string; context?: string; agreed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const quote = (body.quote ?? "").trim();
  const author = (body.author ?? "").trim();
  const category = (body.category ?? "").trim();
  const context = (body.context ?? "").trim();

  if (!body.agreed) {
    return NextResponse.json({ ok: false, error: "게시 동의가 필요합니다." }, { status: 400 });
  }
  if (quote.length < 10) {
    return NextResponse.json({ ok: false, error: "후기는 10자 이상 입력해 주세요." }, { status: 400 });
  }
  if (!author || author.length > 40) {
    return NextResponse.json({ ok: false, error: "표시할 이름(별칭)을 입력해 주세요." }, { status: 400 });
  }
  const cat = CATEGORIES.has(category) ? category : "VISA_STAY";

  try {
    await prisma.testimonial.create({
      data: {
        quote: quote.slice(0, 1000),
        author: author.slice(0, 40),
        category: cat,
        context: context.slice(0, 120),
        published: false, // 승인 전 숨김
        sortOrder: 0
      }
    });
  } catch (err) {
    logger.error("[testimonial-submit] create failed", err);
    return NextResponse.json({ ok: false, error: "저장에 실패했습니다." }, { status: 500 });
  }

  void sendTelegramAlert({
    kind: "system",
    title: "새 고객 후기 (승인 대기)",
    lines: [`${author} · ${cat}`, quote.slice(0, 100)],
    url: "/admin/testimonials"
  }).catch((err) => logger.warn("[testimonial-submit] telegram failed", err));

  return NextResponse.json({ ok: true });
}
