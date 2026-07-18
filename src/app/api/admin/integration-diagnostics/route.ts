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
    siteUrl: describe(process.env.NEXT_PUBLIC_SITE_URL),
    adminSessionSecret: describe(process.env.ADMIN_SESSION_SECRET),
    nextauthSecret: describe(process.env.NEXTAUTH_SECRET),
    authSecret: describe(process.env.AUTH_SECRET)
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

  // 3) 실제 서비스 경로(sendTelegramAlert, HTML 서식)로도 발송
  let alertResult: unknown = null;
  try {
    const mod = await import("@/lib/services/telegram-notify");
    alertResult = await mod.sendTelegramAlert({
      kind: "test",
      title: "연동 진단 테스트",
      lines: ["서비스 경로(HTML 서식) 발송 확인"]
    });
  } catch (err) {
    alertResult = { error: String(err) };
  }

  // 4) Lawbot 브릿지 실제 호출 — /quick-check 과 완전히 같은 경로로 때려본다.
  //    설정 누락인지, 연결은 되는데 브릿지가 거부하는지 구분하기 위함.
  const lawbot = await probeLawbot();

  // 5) 법제처(Lightsail 프록시) 실제 호출.
  //    공개 법령검색은 IP당 일 3회라 검증용으로 쓰기 어렵다. 여기서는 관리자
  //    경로로 직접 때려 status(env_missing / upstream_error / ok)를 그대로 본다.
  const law = await probeLaw();

  return NextResponse.json({
    ok: true,
    env: envReport(),
    getMe,
    plainSend,
    alertResult,
    lawbot,
    law
  });
}

async function probeLaw(): Promise<unknown> {
  const missing = (["LAW_OC", "LAW_PROXY_TOKEN"] as const).filter(
    (k) => !process.env[k]?.trim()
  );

  try {
    const { searchTargetDetailed } = await import("@/lib/services/law-api-service");
    const started = Date.now();
    const outcome = await searchTargetDetailed("law", "출입국관리법", 1);
    return {
      configuredMissing: missing,
      // status 의미: ok=결과있음 / empty=응답정상 결과0건 /
      //   env_missing=LAW_OC·LAW_PROXY_TOKEN 없음 / upstream_error=프록시·법제처 실패
      status: outcome.status,
      message: outcome.message,
      itemCount: outcome.items?.length ?? 0,
      firstItemTitle: outcome.items?.[0]?.title ?? null,
      elapsedMs: Date.now() - started,
      proxyUrl: process.env.LAW_PROXY_URL?.trim() || "(미설정 → 하드코딩 폴백)"
    };
  } catch (err) {
    return {
      configuredMissing: missing,
      status: "exception",
      message: err instanceof Error ? err.message : String(err)
    };
  }
}

async function probeLawbot(): Promise<unknown> {
  const missing = (
    ["LAWBOT_BRIDGE_BASE_URL", "LAWBOT_SERVICE_KEY", "LAWBOT_SERVICE_CALLER"] as const
  ).filter((k) => !process.env[k]?.trim());

  if (missing.length) {
    return {
      ok: false,
      reason: "missing_env",
      missing,
      hint: "이 3개가 모두 있어야 /quick-check 가 동작합니다."
    };
  }

  try {
    const { createLawbotBridgeHttpClientFromEnv } = await import(
      "@/lib/services/lawbot-bridge-http-client"
    );
    const client = createLawbotBridgeHttpClientFromEnv();
    const started = Date.now();
    const result = await client.intakeAnalyze({
      fact: "진단용 테스트 질의입니다. 외국인 체류자격 변경 절차를 간단히 확인합니다.",
      category: "immigration"
    } as never);
    return {
      ok: true,
      elapsedMs: Date.now() - started,
      // 응답 전문은 길 수 있어 형태만 요약
      shape: result && typeof result === "object" ? Object.keys(result) : typeof result
    };
  } catch (err) {
    return {
      ok: false,
      reason: "call_failed",
      name: err instanceof Error ? err.name : "unknown",
      message: err instanceof Error ? err.message : String(err)
    };
  }
}
