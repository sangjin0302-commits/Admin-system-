/**
 * 텔레그램 알림 전송 회귀 잠금.
 *
 * 실제 텔레그램 채널로 메시지가 "진짜 도착하는지"는 봇 토큰·chat_id 가 필요하고
 * 매 실행마다 실채널을 스팸하므로 e2e 로 못 잠근다. 대신 fetch 를 가로채
 * "무엇을, 어디로, 어떻게" 보내는지 + 오설정/오류 시 크론을 죽이지 않는지를 잠근다.
 *
 * 검증:
 *  1) 설정되면 Telegram sendMessage 로 올바른 chat_id·HTML 본문을 POST 하고 ok:true
 *  2) 토큰/chat_id 없으면 fetch 호출 없이 not_configured (no-op, throw 안 함)
 *  3) 텔레그램이 4xx/5xx 여도 throw 하지 않고 ok:false 반환 (크론 안전)
 *  4) <, >, & 는 HTML 이스케이프
 *
 * 실행: npx tsx scripts/tests/telegram-notify-check.ts
 */
import assert from "node:assert/strict";

import { sendTelegramAlert } from "@/lib/services/telegram-notify";

type Captured = { url: string; body: any } | null;

const realFetch = globalThis.fetch;

function mockFetch(status: number): () => Captured {
  let captured: Captured = null;
  globalThis.fetch = (async (url: any, init: any) => {
    captured = { url: String(url), body: init?.body ? JSON.parse(init.body) : null };
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => "",
    } as unknown as Response;
  }) as typeof fetch;
  return () => captured;
}

function restoreFetch() {
  globalThis.fetch = realFetch;
}

function setEnv(token?: string, chatId?: string) {
  if (token === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
  else process.env.TELEGRAM_BOT_TOKEN = token;
  if (chatId === undefined) delete process.env.TELEGRAM_ADMIN_CHAT_ID;
  else process.env.TELEGRAM_ADMIN_CHAT_ID = chatId;
  // 폴백 변수도 정리해 테스트 간 오염 방지.
  delete process.env.TELEGRAM_CHAT_ID;
}

async function main() {
  // 1) 정상 설정 → 올바른 전송
  {
    setEnv("BOT_TOKEN_123", "CHAT_999");
    const get = mockFetch(200);
    const r = await sendTelegramAlert({
      kind: "system",
      title: "블로그 자동 번역",
      lines: ["EN 커버리지: 82/100 (82%)", "⚠️ EN 실패: some-slug"],
    });
    const cap = get();
    restoreFetch();

    assert.equal(r.ok, true, "설정되면 ok:true 여야 함");
    assert.ok(cap, "fetch 가 호출되어야 함");
    assert.ok(cap!.url.includes("/botBOT_TOKEN_123/sendMessage"), "토큰이 URL 에 실려야 함");
    assert.equal(cap!.body.chat_id, "CHAT_999", "관리자 chat_id 로 보내야 함");
    assert.equal(cap!.body.parse_mode, "HTML", "HTML 모드여야 함");
    assert.ok(cap!.body.text.includes("블로그 자동 번역"), "제목이 본문에 포함돼야 함");
    assert.ok(cap!.body.text.includes("EN 커버리지"), "라인이 본문에 포함돼야 함");
    console.log("✓ 1) 정상 설정 시 올바른 chat_id·HTML 전송");
  }

  // 2) 미설정 → no-op, throw 안 함, fetch 호출 없음
  {
    setEnv(undefined, undefined);
    const get = mockFetch(200);
    const r = await sendTelegramAlert({ kind: "system", title: "x" });
    const cap = get();
    restoreFetch();

    assert.equal(r.ok, false, "미설정이면 ok:false");
    assert.equal(r.reason, "not_configured", "이유는 not_configured");
    assert.equal(cap, null, "미설정이면 fetch 를 호출하면 안 됨(스팸 방지)");
    console.log("✓ 2) 미설정 시 no-op (크론 안 죽음)");
  }

  // 3) 텔레그램 오류(4xx/5xx) → throw 안 함, ok:false
  {
    setEnv("T", "C");
    mockFetch(429);
    const r = await sendTelegramAlert({ kind: "system", title: "x" });
    restoreFetch();

    assert.equal(r.ok, false, "HTTP 오류면 ok:false");
    assert.ok(String(r.reason).startsWith("http_"), "이유는 http_<status>");
    console.log("✓ 3) 텔레그램 오류여도 예외 없이 ok:false (크론 안전)");
  }

  // 4) HTML 이스케이프
  {
    setEnv("T", "C");
    const get = mockFetch(200);
    await sendTelegramAlert({ kind: "system", title: "a<b>&c" });
    const cap = get();
    restoreFetch();

    assert.ok(cap!.body.text.includes("a&lt;b&gt;&amp;c"), "< > & 는 이스케이프돼야 함");
    console.log("✓ 4) HTML 이스케이프");
  }

  console.log("\nPASS — 텔레그램 알림 전송 잠금 4/4");
}

main()
  .catch((err) => {
    restoreFetch();
    console.error("FAIL —", err instanceof Error ? err.message : err);
    process.exit(1);
  });
