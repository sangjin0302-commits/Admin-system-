/**
 * 법제처 Lightsail 프록시 호출 계약 고정 테스트.
 *
 * 이 프로젝트에서 "설정했는데 안 된다"의 원인은 대부분 코드 로직이 아니라
 * 이름 불일치였다(텔레그램 chat_id 변수명, Lawbot 3계열, MARKET_BOT 유령 문서).
 * 프록시도 같은 함정이 있어 아래 4가지를 코드로 못 박는다.
 *
 *   1. 인증 헤더 이름은 `X-Proxy-Token`
 *      — 프록시(law_proxy_server.py)의 _check_auth 가 이 이름만 읽는다.
 *        바꾸면 전량 401이 되고, 응답은 "결과 0건"처럼 보여 원인을 찾기 어렵다.
 *   2. 경로는 `/drf/{endpoint}`
 *   3. 쿼리에 `OC` 와 `type` 이 포함
 *   4. LAW_OC / LAW_PROXY_TOKEN 이 없으면 네트워크 호출 없이 env_missing 으로 끝난다
 *      (없는 상태로 프록시를 두드려 401 로그를 쌓지 않기 위함)
 */

import assert from "node:assert/strict";

async function main() {
  // ── 1) 환경변수가 없으면 호출 자체를 하지 않아야 한다 ──
  delete process.env.LAW_OC;
  delete process.env.LAW_PROXY_TOKEN;

  const realFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = (async () => {
    fetchCalled = true;
    return { ok: true, status: 200, json: async () => ({}) };
  }) as unknown as typeof globalThis.fetch;

  const { searchTargetDetailed } = await import("./law-api-service");
  const missing = await searchTargetDetailed("law", "출입국관리법", 1);
  globalThis.fetch = realFetch;

  assert.equal(missing.status, "env_missing", "환경변수 없으면 env_missing 이어야 한다");
  assert.equal(fetchCalled, false, "환경변수 없는데 프록시를 호출했다");

  // ── 2) 환경변수가 있으면 정확한 헤더·경로·쿼리로 나가야 한다 ──
  process.env.LAW_OC = "test_oc";
  process.env.LAW_PROXY_TOKEN = "test_proxy_token";
  process.env.LAW_PROXY_URL = "http://proxy.test:8080";

  let capturedUrl = "";
  let capturedHeaders: Record<string, string> = {};
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    capturedUrl = String(url);
    capturedHeaders = (init.headers ?? {}) as Record<string, string>;
    // 법제처 DRF 형태의 빈 응답
    return { ok: true, status: 200, json: async () => ({ LawSearch: { law: [] } }) };
  }) as unknown as typeof globalThis.fetch;

  await searchTargetDetailed("law", "출입국관리법", 1);
  globalThis.fetch = realFetch;

  // 헤더 이름이 프록시와 정확히 일치해야 한다(대소문자 포함).
  assert.equal(
    capturedHeaders["X-Proxy-Token"],
    "test_proxy_token",
    "프록시 인증 헤더는 X-Proxy-Token 이어야 한다(law_proxy_server.py _check_auth)"
  );

  // 경로·쿼리 계약
  assert.ok(capturedUrl.startsWith("http://proxy.test:8080/drf/"), `경로 계약 위반: ${capturedUrl}`);
  assert.ok(capturedUrl.includes("lawSearch.do"), "검색은 lawSearch.do 를 써야 한다");
  const query = new URL(capturedUrl).searchParams;
  assert.equal(query.get("OC"), "test_oc", "OC 파라미터가 빠졌다");
  assert.equal(query.get("type"), "JSON", "type=JSON 이어야 파서가 동작한다");
  assert.equal(query.get("target"), "law");

  // ── 3) LAW_PROXY_URL 미설정 시 하드코딩 폴백이 유지되는지 ──
  //    질의를 바꾼다 — 같은 질의는 응답 캐시에 걸려 fetch가 나가지 않는다.
  delete process.env.LAW_PROXY_URL;
  let fallbackUrl = "";
  globalThis.fetch = (async (url: string) => {
    fallbackUrl = String(url);
    return { ok: true, status: 200, json: async () => ({ LawSearch: { law: [] } }) };
  }) as unknown as typeof globalThis.fetch;
  await searchTargetDetailed("law", "도로교통법-폴백확인", 1);
  globalThis.fetch = realFetch;
  assert.ok(
    fallbackUrl.startsWith("http://3.36.175.81:8080/drf/"),
    `폴백 주소가 바뀌었다: ${fallbackUrl} — 운영에서 LAW_PROXY_URL 을 명시하지 않으면 이 IP로 나간다`
  );

  console.log("law proxy contract tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
