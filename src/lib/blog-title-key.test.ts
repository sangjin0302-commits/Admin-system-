import assert from "node:assert/strict";
import { blogTitleKey } from "@/lib/blog-title-key";

// 빈/공백
assert.equal(blogTitleKey(""), "");
assert.equal(blogTitleKey("   "), "");

// %-인코딩 변종과 디코딩본이 같은 키 → 중복으로 묶임(핵심 회귀).
assert.equal(blogTitleKey("A%20B"), blogTitleKey("A B"));
assert.equal(blogTitleKey("비자%20신청"), blogTitleKey("비자 신청"));

// + 를 공백으로
assert.equal(blogTitleKey("A+B"), "a b");

// 엔티티
assert.equal(blogTitleKey("Tom &amp; Jerry"), "tom & jerry");
assert.equal(blogTitleKey("a &lt;b&gt;"), "a <b>");

// 공백 정규화 + 대소문자 무시
assert.equal(blogTitleKey("  Hello   World  "), "hello world");
assert.equal(blogTitleKey("HELLO world"), blogTitleKey("hello WORLD"));

// 서로 다른 제목은 다른 키
assert.notEqual(blogTitleKey("비자 신청"), blogTitleKey("행정심판 청구"));

// 깨진 % 시퀀스도 던지지 않고 폴백
assert.equal(typeof blogTitleKey("100% 완성"), "string");

console.log("blog-title-key tests passed");
