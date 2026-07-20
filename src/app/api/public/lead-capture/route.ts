import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { sendEmail } from "@/lib/services/email-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import {
  consumeRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function autoresponderHtml(name?: string) {
  const greeting = name ? `${name}님, 안녕하세요.` : "안녕하세요.";
  return `
    <div style="font-family:'Pretendard',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:20px;color:#1a2744;margin:0;">ETHOS 행정사사무소</h1>
        <p style="font-size:12px;color:#b8963e;margin:4px 0 0;">Administrative Services Office</p>
      </div>
      <p style="font-size:15px;color:#333;line-height:1.7;">
        ${greeting}<br><br>
        무료 검토 요청이 정상적으로 접수되었습니다. 감사합니다.<br>
        담당 행정사가 내용을 확인한 후 <strong>영업일 24시간 이내</strong>에
        검토 방향을 메일로 회신드리겠습니다.
      </p>
      <p style="font-size:14px;color:#555;line-height:1.7;">
        급하신 경우 아래 채널로 바로 연락 주셔도 됩니다.
      </p>
      <p style="font-size:14px;color:#333;line-height:1.8;margin:8px 0 0;">
        · 네이버 톡톡: <a href="http://talk.naver.com/WP044ZF" style="color:#b8963e;">가장 빠른 검토</a><br>
        · 이메일: <a href="mailto:a.attorneyjean@gmail.com" style="color:#b8963e;">a.attorneyjean@gmail.com</a>
      </p>
      <p style="margin-top:16px;padding:12px 16px;background:#f8f6f0;border-radius:8px;font-size:13px;color:#555;line-height:1.6;">
        검토는 무료입니다. 이후 본격적인 유료 상담을 진행하시는 경우에도,
        <strong>수임이 확정되면 상담료는 전액 차감</strong>됩니다.
      </p>
      <hr style="border:none;border-top:1px solid #e5e3da;margin:24px 0;" />
      <p style="font-size:12px;color:#999;line-height:1.6;">
        ETHOS 행정사사무소 · 행정사 지상진<br>
        <a href="https://ethosattorney.com" style="color:#b8963e;">ethosattorney.com</a>
      </p>
    </div>
  `;
}

export async function POST(req: Request) {
  try {
    // Light rate limit (best-effort; skip on failure)
    try {
      const ip = getClientIpFromHeaders(req.headers);
      const rl = consumeRateLimit({
        namespace: "lead-capture",
        key: ip,
        max: 5,
        windowMs: 60_000,
      });
      if (!rl.allowed) {
        return NextResponse.json(
          { ok: false, error: "rate_limited" },
          { status: 429 }
        );
      }
    } catch {
      // ignore rate-limit failures
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const phoneDigits = phone.replace(/\D/g, "");
    const hasValidPhone = phoneDigits.length >= 9 && phoneDigits.length <= 15;
    const name =
      typeof body?.name === "string" && body.name.trim()
        ? body.name.trim()
        : undefined;
    const category =
      typeof body?.category === "string" && body.category.trim()
        ? body.category.trim()
        : undefined;
    const source =
      typeof body?.source === "string" && body.source.trim()
        ? body.source.trim()
        : "lead_capture";

    // Email is required unless a valid phone number is provided (phone-only quick form leads).
    const hasValidEmail = Boolean(email) && EMAIL_RE.test(email);
    if (!hasValidEmail && !hasValidPhone) {
      return NextResponse.json(
        { ok: false, error: email ? "invalid_email" : "contact_required" },
        { status: 400 }
      );
    }

    // Store the lead as an un-converted intake abandonment (step 0 = lead only).
    try {
      const existing = await prisma.intakeAbandonment.findFirst({
        where: hasValidEmail
          ? { email, convertedAt: null }
          : { phone, convertedAt: null },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        await prisma.intakeAbandonment.update({
          where: { id: existing.id },
          data: { name, category, phone: phone || undefined, step: 0 },
        });
      } else {
        await prisma.intakeAbandonment.create({
          data: {
            email: hasValidEmail ? email : "",
            phone: phone || undefined,
            name,
            category,
            step: 0,
          },
        });
      }
    } catch {
      // Never block the lead on a storage failure.
    }

    // Fire-and-forget autoresponder (do not await failures blocking response).
    if (hasValidEmail) {
      void sendEmail({
        to: email,
        subject: "[ETHOS] 무료 검토 요청이 접수되었습니다",
        html: autoresponderHtml(name),
      }).catch(() => {});
    }

    // Best-effort internal Telegram alert.
    // await 필수 — 서버리스는 응답 반환 후 람다를 얼리므로 미await 시 발송이 유실됨.
    await sendTelegramAlert({
      kind: "inquiry",
      title: `새 무료 검토 리드: ${hasValidEmail ? email : phone}`,
      lines: [
        name ? `이름: ${name}` : "이름: (미입력)",
        phone ? `연락처: ${phone}` : "연락처: (미입력)",
        category ? `관심 분야: ${category}` : "관심 분야: (미입력)",
        `유입: ${source}`,
      ],
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
