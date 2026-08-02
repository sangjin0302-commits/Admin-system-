/**
 * 관보 클라이언트 계약 검사.
 *
 * 관보봇(Gwanbo-bot)에 GET /gazette 가 붙기 전에, ETHOS 쪽이 봇 응답을 제대로
 * 정규화하는지 네트워크 없이 검증한다. 봇 응답 형태가 조금씩 달라도(배열/{items},
 * 필드명 차이, 날짜 형식) 게시판이 깨지지 않음을 보장.
 */

import assert from "node:assert/strict";

import { normalizeGazetteResponse, toGazetteUrl } from "@/lib/services/gazette-client";

let failed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL ${name}:`, err instanceof Error ? err.message : err);
  }
}

// 1) URL 정규화: 봇의 실제 엔드포인트 /items/latest 로. base·구 /gazette·정경로 모두 흡수.
check("toGazetteUrl → /items/latest", () => {
  assert.equal(toGazetteUrl("https://bot.example.com"), "https://bot.example.com/items/latest");
  assert.equal(toGazetteUrl("https://bot.example.com/"), "https://bot.example.com/items/latest");
  assert.equal(toGazetteUrl("https://bot.example.com/gazette"), "https://bot.example.com/items/latest");
  assert.equal(toGazetteUrl("https://bot.example.com/items/latest"), "https://bot.example.com/items/latest");
});

// 1b) Gwanbo-bot 실제 응답(GazetteItemRead) 매핑 검증.
check("Gwanbo-bot GazetteItemRead 매핑", () => {
  const items = normalizeGazetteResponse([
    {
      id: 42,
      source_type: "law",
      title: "행정사법 일부개정법률",
      issuing_agency: "법무부",
      publication_date: "2026-07-30",
      category: "법률",
      legal_basis: null,
      summary: "개정 요지…",
      content: "본문…",
      original_url: "https://gwanbo.go.kr/x/42"
    }
  ]);
  assert.equal(items.length, 1);
  const i = items[0];
  assert.equal(i.title, "행정사법 일부개정법률");
  assert.equal(i.agency, "법무부");
  assert.equal(i.category, "법률");
  assert.equal(i.url, "https://gwanbo.go.kr/x/42");
  assert.equal(i.summary, "개정 요지…");
  assert.ok(i.dateMs > 0, "publication_date 파싱");
  assert.equal(i.id, "42");
});

// 2) 배열 형태 + 필드명 변형 흡수.
check("array form + field fallbacks", () => {
  const items = normalizeGazetteResponse([
    { subject: "행정사법 일부개정", department: "법무부", type: "법률", date: "2026-07-30", link: "https://x/1" },
    { title: "고시 제2026-1호", 기관: "행정안전부", 구분: "고시", 게시일: "20260728", url: "https://x/2" },
  ]);
  assert.equal(items.length, 2);
  const a = items.find((i) => i.title === "행정사법 일부개정")!;
  assert.equal(a.agency, "법무부");
  assert.equal(a.category, "법률");
  assert.equal(a.url, "https://x/1");
  assert.ok(a.dateMs > 0);
  const b = items.find((i) => i.title === "고시 제2026-1호")!;
  assert.equal(b.agency, "행정안전부");
  assert.equal(b.category, "고시");
  assert.ok(b.dateMs > 0, "YYYYMMDD 날짜 파싱");
});

// 3) {items}/{data}/{results} 래퍼 흡수.
check("wrapped {items}/{data}/{results}", () => {
  assert.equal(normalizeGazetteResponse({ items: [{ title: "A" }] }).length, 1);
  assert.equal(normalizeGazetteResponse({ data: [{ title: "B" }] }).length, 1);
  assert.equal(normalizeGazetteResponse({ results: [{ title: "C" }] }).length, 1);
});

// 4) 제목 없는 항목은 버린다.
check("drops items without title", () => {
  const items = normalizeGazetteResponse([{ agency: "x" }, { title: "유효" }]);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "유효");
});

// 5) 다양한 날짜 형식 + 최신순 정렬.
check("date parsing + desc sort", () => {
  const items = normalizeGazetteResponse([
    { title: "old", date: "2026-01-01" },
    { title: "new", date: "2026-12-31" },
    { title: "epoch", publishedAt: 1_770_000_000 }, // 초 단위(≈2026-02), ms 로 승격돼야
  ]);
  assert.equal(items[0].title, "new", "가장 최신이 앞");
  const epoch = items.find((i) => i.title === "epoch")!;
  assert.ok(epoch.dateMs > 1_000_000_000_000, "초→ms 승격");
});

// 6) 잘못된 입력은 빈 배열(게시판 안 깨짐).
check("garbage input → empty", () => {
  assert.deepEqual(normalizeGazetteResponse(null), []);
  assert.deepEqual(normalizeGazetteResponse("nope"), []);
  assert.deepEqual(normalizeGazetteResponse({ foo: 1 }), []);
});

// 7) limit 적용.
check("respects limit", () => {
  const many = Array.from({ length: 100 }, (_, i) => ({ title: `t${i}`, date: `2026-01-${(i % 28) + 1}` }));
  assert.equal(normalizeGazetteResponse(many, 10).length, 10);
});

if (failed > 0) {
  console.error(`[gazette-client] ${failed} 검사 실패`);
  process.exit(1);
}
console.log("[gazette-client] OK — 봇 응답 정규화 계약 유지(배열/{items}·필드폴백·날짜·정렬·limit).");
