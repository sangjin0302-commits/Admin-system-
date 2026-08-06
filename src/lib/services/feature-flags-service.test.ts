import assert from "node:assert/strict";

import {
  FEATURE_REGISTRY,
  getFeatureRegistry,
  isPublicFeatureKey,
  type FeatureCategory,
} from "@/lib/services/feature-flags-service";

// ── 1. 레지스트리 기본 구조 ─────────────────────────────
assert.ok(Array.isArray(FEATURE_REGISTRY));
assert.ok(FEATURE_REGISTRY.length > 30, "레지스트리에 30개 이상의 기능이 있어야 함");
assert.equal(getFeatureRegistry(), FEATURE_REGISTRY);

// ── 2. 키 유일성 (중복 없음) ─────────────────────────────
{
  const keys = FEATURE_REGISTRY.map((f) => f.key);
  const unique = new Set(keys);
  assert.equal(unique.size, keys.length, "feature key는 유일해야 함");
}

// ── 3. 모든 항목이 필수 필드 채움 ────────────────────────
for (const f of FEATURE_REGISTRY) {
  assert.equal(typeof f.key, "string");
  assert.ok(f.key.length > 0);
  assert.equal(typeof f.label, "string");
  assert.ok(f.label.length > 0);
  assert.equal(typeof f.default, "boolean");
  const validCats: FeatureCategory[] = [
    "marketing",
    "operations",
    "ux",
    "portal",
    "ai",
    "platform",
    "analytics",
    "intake",
    "content",
    "admin",
  ];
  assert.ok(validCats.includes(f.category), `unknown category: ${f.category}`);
}

// ── 4. isPublicFeatureKey — public: true 만 인정 ─────────
{
  const pubDef = FEATURE_REGISTRY.find((f) => f.public);
  assert.ok(pubDef, "public 플래그가 최소 1개 존재해야 함");
  assert.equal(isPublicFeatureKey(pubDef.key), true);

  const privDef = FEATURE_REGISTRY.find((f) => !f.public);
  assert.ok(privDef);
  assert.equal(isPublicFeatureKey(privDef.key), false);
}

// ── 5. 알 수 없는 키는 public: false ─────────────────────
assert.equal(isPublicFeatureKey("nonexistent_key_xyz"), false);
assert.equal(isPublicFeatureKey(""), false);

// ── 6. 이번 작업에서 추가된 3개 플래그가 존재 ────────────
{
  const keys = new Set(FEATURE_REGISTRY.map((f) => f.key));
  assert.ok(keys.has("e2e_runner_ui"), "e2e_runner_ui 플래그 등록 필요");
  assert.ok(keys.has("arch_diagram"), "arch_diagram 플래그 등록 필요");
  assert.ok(keys.has("sentry_monitoring"), "sentry_monitoring 플래그 등록 필요");
}

// ── 7. e2e_runner_ui 기본 false, arch_diagram 기본 true ──
{
  const e2e = FEATURE_REGISTRY.find((f) => f.key === "e2e_runner_ui");
  const arch = FEATURE_REGISTRY.find((f) => f.key === "arch_diagram");
  const sentry = FEATURE_REGISTRY.find((f) => f.key === "sentry_monitoring");
  assert.equal(e2e?.default, false);
  assert.equal(arch?.default, true);
  assert.equal(sentry?.default, false);
}

// ── 8. 카테고리별 최소 항목 존재 ─────────────────────────
{
  const marketing = FEATURE_REGISTRY.filter((f) => f.category === "marketing").length;
  const ops = FEATURE_REGISTRY.filter((f) => f.category === "operations").length;
  const ux = FEATURE_REGISTRY.filter((f) => f.category === "ux").length;
  assert.ok(marketing > 0);
  assert.ok(ops > 0);
  assert.ok(ux > 0);
}

// ── 9. description은 문자열 (지정 시) ────────────────────
for (const f of FEATURE_REGISTRY) {
  if (f.description !== undefined) {
    assert.equal(typeof f.description, "string");
    assert.ok(f.description.length > 0);
  }
}

// ── 10. public 플래그도 유효한 키 ────────────────────────
{
  for (const f of FEATURE_REGISTRY) {
    if (f.public === true) {
      assert.equal(isPublicFeatureKey(f.key), true);
    }
  }
}

console.log("feature-flags-service tests passed");
