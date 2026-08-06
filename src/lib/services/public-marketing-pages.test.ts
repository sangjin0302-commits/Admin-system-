import assert from "node:assert/strict";

import {
  buildServiceIntakeHref,
  buildWebsiteIntakeHref,
  getPublicMarketingService,
  localizeMarketingService,
  PUBLIC_MARKETING_SAFE_NOTICE,
  PUBLIC_MARKETING_SAFE_NOTICE_EN,
  PUBLIC_MARKETING_SERVICES
} from "@/lib/services/public-marketing-pages";

// ── Service catalog shape ─────────────────────────────────────────────
assert.equal(PUBLIC_MARKETING_SERVICES.length, 7);
assert.equal(PUBLIC_MARKETING_SAFE_NOTICE.includes("일반 정보 제공"), true);
assert.equal(PUBLIC_MARKETING_SAFE_NOTICE.includes("공식 기관 확인"), true);

// ── Intake href builders ──────────────────────────────────────────────
assert.equal(buildWebsiteIntakeHref(), "/intake?source=website&channel=homepage");
assert.equal(buildWebsiteIntakeHref("services"), "/intake?source=website&channel=services");

const expected = new Map([
  ["visa", "visa"],
  ["corporation", "corporation"],
  ["administrative-appeal", "administrative_appeal"],
  ["fact-contract", "fact_contract"],
  ["permit-license", "permit_license"],
  ["arabic-interpretation", "arabic_interpretation"],
  ["civil-petition", "civil_petition"]
]);

for (const [slug, practiceArea] of expected) {
  const service = getPublicMarketingService(slug);
  assert.ok(service, `Missing service: ${slug}`);
  assert.equal(service.practiceArea, practiceArea);
  assert.equal(service.audience.length > 0, true);
  assert.equal(service.scope.length > 0, true);
  assert.equal(service.preparation.length > 0, true);
  assert.equal(service.process.length > 0, true);
  assert.equal(service.cautions.length > 0, true);

  const href = buildServiceIntakeHref(service);
  assert.equal(href.includes("/intake?"), true);
  assert.equal(href.includes("source=website"), true);
  assert.equal(href.includes("channel=service_page"), true);
  assert.equal(href.includes(`practice_area=${practiceArea}`), true);
}

assert.equal(getPublicMarketingService("missing"), null);

// ── localizeMarketingService: ko + en ────────────────────────────────
const visa = getPublicMarketingService("visa");
assert.ok(visa, "Expected visa service for localization test");

const ko = localizeMarketingService(visa, "ko");
assert.equal(ko.title, visa.title);
assert.equal(ko.summary, visa.summary);
assert.deepEqual(ko.audience, visa.audience);
assert.deepEqual(ko.scope, visa.scope);
assert.deepEqual(ko.preparation, visa.preparation);
assert.deepEqual(ko.process, visa.process);
assert.deepEqual(ko.cautions, visa.cautions);
assert.equal(ko.safeNotice, PUBLIC_MARKETING_SAFE_NOTICE);

const en = localizeMarketingService(visa, "en");
assert.equal(en.title, visa.titleEn);
assert.equal(en.summary, visa.summaryEn);
assert.deepEqual(en.audience, visa.audienceEn);
assert.deepEqual(en.scope, visa.scopeEn);
assert.deepEqual(en.preparation, visa.preparationEn);
assert.deepEqual(en.process, visa.processEn);
assert.deepEqual(en.cautions, visa.cautionsEn);
assert.equal(en.safeNotice, PUBLIC_MARKETING_SAFE_NOTICE_EN);

// en must actually differ from ko for real bilingual content
assert.notEqual(en.title, ko.title);
assert.notEqual(en.summary, ko.summary);

// en falls back to ko when an English title/summary is missing
const koFallbackSource = { ...visa, titleEn: "", summaryEn: "" };
const fallback = localizeMarketingService(koFallbackSource, "en");
assert.equal(fallback.title, visa.title);
assert.equal(fallback.summary, visa.summary);

console.log("public marketing pages tests passed");
