import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/services/rate-limiter";
import { beginSubscribe } from "@/lib/services/newsletter-service";
import { sendEmail } from "@/lib/services/email-service";
import { logger } from "@/lib/utils/logger";

function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethosattorney.com").replace(/\/+$/, "");
}

export async function POST(request: Request) {
  const ip = getIp(request);
  const rl = rateLimit(`newsletter:sub:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await request.json().catch(() => null);
  const email = body && typeof body.email === "string" ? body.email : "";
  const categories = body && Array.isArray(body.categories) ? body.categories.map(String) : undefined;

  const result = await beginSubscribe(email, categories);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  if (result.alreadyConfirmed) {
    return NextResponse.json({ ok: true, alreadyConfirmed: true });
  }

  const confirmLink = `${siteUrl()}/newsletter/confirm?token=${encodeURIComponent(result.token)}`;
  const send = await sendEmail({
    to: email,
    subject: "[ETHOS] 뉴스레터 구독 확인",
    html: `
      <div style="font-family:'Pretendard',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:20px;color:#1a2744;margin:0 0 16px;">ETHOS 행정사사무소 뉴스레터</h1>
        <p style="font-size:15px;color:#333;line-height:1.7;">
          아래 버튼을 눌러 구독을 확인해 주세요. 48시간 내에 확인하지 않으면 만료됩니다.
        </p>
        <a href="${confirmLink}" style="display:inline-block;margin:16px 0;padding:10px 24px;background:#1a2744;color:#fff;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;">
          구독 확인
        </a>
        <p style="font-size:11px;color:#999;">본인이 신청하지 않았다면 이 이메일을 무시해 주세요.</p>
      </div>
    `,
  });

  if (!send.ok) {
    logger.warn("[newsletter/subscribe] confirmation email send failed", send.error);
  }

  return NextResponse.json({ ok: true, alreadyConfirmed: false });
}
