import assert from "node:assert/strict";
import {
  parseCardNews,
  serializeCardNews,
  splitCardNews,
  type CardNewsSlide,
} from "@/lib/services/card-news";

// ── parseCardNews ──────────────────────────────────────
assert.deepEqual(parseCardNews(""), []);
assert.deepEqual(parseCardNews(null), []);
assert.deepEqual(parseCardNews("not json"), []);
assert.deepEqual(parseCardNews("{}"), []); // 객체는 배열 아님 → []
assert.deepEqual(parseCardNews("[]"), []);

// 유효 슬라이드 + 빈 슬라이드 제거 + 공백 트림
const parsed = parseCardNews(
  JSON.stringify([
    { image: " https://x/a.png ", title: " 커버 ", body: " 표지 본문 " },
    { title: "카드2" },
    {}, // 전부 빈 값 → 제거
    { image: "", title: "", body: "" }, // 전부 공백 → 제거
    "bad", // 객체 아님 → 무시
  ]),
);
assert.equal(parsed.length, 2);
assert.deepEqual(parsed[0], { image: "https://x/a.png", title: "커버", body: "표지 본문" });
assert.deepEqual(parsed[1], { title: "카드2" });

// 배열 직접 입력도 허용
assert.equal(parseCardNews([{ title: "t" }] as CardNewsSlide[]).length, 1);

// ── serializeCardNews ─────────────────────────────────
assert.equal(serializeCardNews([]), null); // 빈 → null(컬럼 비움)
assert.equal(serializeCardNews([{}, { image: "" }]), null); // 전부 빈 → null
const ser = serializeCardNews([{ title: " a ", body: "" }, { image: "u" }]);
assert.ok(ser);
assert.deepEqual(JSON.parse(ser as string), [{ title: "a" }, { image: "u" }]);

// 라운드트립: parse(serialize(x)) 안정
const round = parseCardNews(serializeCardNews([{ title: "x", body: "y" }]));
assert.deepEqual(round, [{ title: "x", body: "y" }]);

// ── splitCardNews (첫 장 = 커버) ──────────────────────
assert.deepEqual(splitCardNews([]), { cover: null, rest: [] });
const s = splitCardNews([{ title: "cover" }, { title: "b" }, { title: "c" }]);
assert.deepEqual(s.cover, { title: "cover" });
assert.equal(s.rest.length, 2);
assert.deepEqual(s.rest[0], { title: "b" });

console.log("card-news tests passed");
