import assert from "node:assert/strict";

async function main() {
  const {
    toPublicAnalyzeUrl,
    isPublicAnalyzeConfigured,
    extractApplicableLawNames,
    toPublicQuickCheckPayload,
    PUBLIC_ANALYZE_MAX_INPUT
  } = await import("./lawbot-analyze-public-client");

  // ── URL 변환: 관리자 경로가 고객 경로로 새지 않아야 한다 ──
  assert.equal(toPublicAnalyzeUrl("https://bot.example.com/analyze/admin"), "https://bot.example.com/analyze");
  assert.equal(toPublicAnalyzeUrl("https://bot.example.com/analyze"), "https://bot.example.com/analyze");
  assert.equal(toPublicAnalyzeUrl("https://bot.example.com"), "https://bot.example.com/analyze");
  // 끝의 슬래시가 있어도 admin이 벗겨져야 한다.
  assert.equal(toPublicAnalyzeUrl("https://bot.example.com/analyze/admin/"), "https://bot.example.com/analyze");

  // ── 설정 감지: 관리자 URL만 있어도 공개 경로를 유도할 수 있어야 한다 ──
  delete process.env.LAWBOT_ANALYZE_PUBLIC_URL;
  delete process.env.LAWBOT_ANALYZE_URL;
  assert.equal(isPublicAnalyzeConfigured(), false);

  process.env.LAWBOT_ANALYZE_URL = "https://bot.example.com/analyze/admin";
  assert.equal(isPublicAnalyzeConfigured(), true);

  // ── 🔴 핵심 보안 검증: 공개 호출에 관리자 토큰이 절대 실리면 안 된다 ──
  process.env.LAWBOT_ANALYZE_TOKEN = "super-secret-admin-token";
  let capturedUrl = "";
  let capturedHeaders: Record<string, string> = {};
  let capturedBody = "";

  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    capturedUrl = String(url);
    capturedHeaders = (init.headers ?? {}) as Record<string, string>;
    capturedBody = String(init.body ?? "");
    return {
      ok: true,
      status: 200,
      json: async () => ({ input_summary: "요약", risk_flags: ["위험1"] })
    };
  }) as unknown as typeof globalThis.fetch;

  const { analyzePublic } = await import("./lawbot-analyze-public-client");
  const result = await analyzePublic("테스트 사안 내용입니다.");
  globalThis.fetch = realFetch;

  assert.equal(result.status, "ok");
  // 관리자 경로가 아니라 공개 경로로 나가야 한다.
  assert.equal(capturedUrl, "https://bot.example.com/analyze");
  // 어떤 헤더에도 토큰 값이 들어가면 안 된다.
  const headerBlob = JSON.stringify(capturedHeaders).toLowerCase();
  assert.ok(!headerBlob.includes("super-secret-admin-token"), "관리자 토큰이 공개 호출에 실렸다");
  assert.ok(!headerBlob.includes("x-lawbot-token"), "공개 호출에 토큰 헤더가 존재한다");
  // 본문은 fact_input 키를 써야 봇이 받는다.
  assert.ok(capturedBody.includes("fact_input"));

  // ── 입력 상한: 봇의 공개 경로 상한(4000자)을 넘겨 보내지 않는다 ──
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    capturedBody = String(init.body ?? "");
    return { ok: true, status: 200, json: async () => ({}) };
  }) as unknown as typeof globalThis.fetch;
  await analyzePublic("가".repeat(9000));
  globalThis.fetch = realFetch;
  const sent = JSON.parse(capturedBody).fact_input as string;
  assert.equal(sent.length, PUBLIC_ANALYZE_MAX_INPUT);

  // ── 429는 별도 상태로 구분되어야 고객에게 한도 안내를 띄울 수 있다 ──
  globalThis.fetch = (async () => ({ ok: false, status: 429, json: async () => ({}) })) as unknown as typeof globalThis.fetch;
  const limited = await analyzePublic("테스트");
  globalThis.fetch = realFetch;
  assert.equal(limited.status, "rate_limited");

  // ── 응답 화이트리스트: 실무자 전략 필드는 통과하면 안 된다 ──
  const payload = toPublicQuickCheckPayload({
    input_summary: "요약문",
    key_issues: ["쟁점1", "쟁점2"],
    followup_facts: ["확인1"],
    risk_flags: ["위험1"],
    applicable_laws: [{ law: "출입국관리법", summary: "본문요약" }],
    // 아래는 화이트리스트에 없으므로 결과에 나타나면 안 된다.
    ...({ pros: ["유리1"], cons: ["불리1"], argument_strategy: ["전략1"] } as Record<string, unknown>)
  });
  const payloadBlob = JSON.stringify(payload);
  assert.ok(!payloadBlob.includes("유리1"), "pros가 고객 응답에 노출됐다");
  assert.ok(!payloadBlob.includes("불리1"), "cons가 고객 응답에 노출됐다");
  assert.ok(!payloadBlob.includes("전략1"), "argument_strategy가 고객 응답에 노출됐다");
  // 법령은 이름만 나가고 요약 본문은 빠져야 한다.
  assert.deepEqual(payload.applicableLawNames, ["출입국관리법"]);
  assert.ok(!payloadBlob.includes("본문요약"), "법령 요약 본문이 노출됐다");
  assert.equal(payload.summary, "요약문");
  assert.deepEqual(payload.keyIssues, ["쟁점1", "쟁점2"]);

  // ── 법령명 추출: 형태가 깨진 항목은 조용히 건너뛴다 ──
  assert.deepEqual(extractApplicableLawNames([{ law: "민법" }, { nope: 1 }, null, "문자열"]), ["민법"]);

  console.log("lawbot public analyze tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
