/**
 * 외부 연동 진단 — 환경변수 설정 여부 + 텔레그램 실제 발송 결과 확인.
 *
 * 비밀값은 절대 반환하지 않는다. 존재 여부(boolean)와 길이·접두사만 노출.
 *
 * 사용:
 *   GET  /api/admin/integration-diagnostics            → 설정 상태만 조회
 *   POST /api/admin/integration-diagnostics            → 텔레그램 테스트 메시지 실제 발송
 *   Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/* 는 middleware(isProtectedAdminRoute)에서 Basic Auth로 이미 차단된다.
 * 따라서 브라우저 접근은 그 인증을 신뢰하고, 자동화용으로 CRON_SECRET Bearer도 허용한다.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  if (secret && auth === `Bearer ${secret}`) return true;
  // middleware를 통과했다면 Basic Auth가 이미 검증된 요청이다.
  return auth.startsWith("Basic ");
}

/** 비밀값 노출 없이 형태만 요약. */
function describe(value: string | undefined) {
  const v = value?.trim();
  if (!v) return { set: false as const };
  return {
    set: true as const,
    length: v.length,
    prefix: v.slice(0, 4),
    hasWhitespace: v !== value
  };
}

function envReport() {
  return {
    telegramBotToken: describe(process.env.TELEGRAM_BOT_TOKEN),
    telegramAdminChatId: describe(process.env.TELEGRAM_ADMIN_CHAT_ID),
    telegramChatIdFallback: describe(process.env.TELEGRAM_CHAT_ID),
    telegramChannelId: describe(process.env.TELEGRAM_CHANNEL_ID),
    anthropicApiKey: describe(process.env.ANTHROPIC_API_KEY),
    sentryDsnServer: describe(process.env.SENTRY_DSN),
    sentryDsnClient: describe(process.env.NEXT_PUBLIC_SENTRY_DSN),
    cronSecret: describe(process.env.CRON_SECRET),
    siteUrl: describe(process.env.NEXT_PUBLIC_SITE_URL)
  };
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, env: envReport() });
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId =
    process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return NextResponse.json({
      ok: false,
      error: "not_configured",
      env: envReport()
    });
  }

  // 1) 봇 토큰 자체 유효성 (getMe)
  let getMe: unknown = null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    getMe = await res.json();
  } catch (err) {
    getMe = { error: String(err) };
  }

  // 2) 실제 발송 — 평문(parse_mode 없음)으로 먼저 시도해 마크다운 문제와 분리
  let plainSend: unknown = null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "[진단] 텔레그램 연동 테스트 — 평문 발송"
      })
    });
    plainSend = await res.json();
  } catch (err) {
    plainSend = { error: String(err) };
  }

  // 3) 실제 서비스 경로(sendTelegramAlert, MarkdownV2)로도 발송
  let alertResult: unknown = null;
  try {
    const mod = await import("@/lib/services/telegram-notify");
    alertResult = await mod.sendTelegramAlert({
      kind: "test",
      title: "연동 진단 테스트",
      lines: ["서비스 경로(MarkdownV2) 발송 확인"]
    });
  } catch (err) {
    alertResult = { error: String(err) };
  }

  return NextResponse.json({
    ok: true,
    env: envReport(),
    getMe,
    plainSend,
    alertResult
  });
}
