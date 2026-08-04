/**
 * SiteSetting 키 정합성 잠금.
 *
 * DEFAULTS 와 LABELS 의 키 집합이 정확히 일치해야 한다. 한쪽에만 있는 키는
 * - LABELS 누락 → admin 편집기에 안 보임(편집 불가)
 * - DEFAULTS 누락 → 저장 API(/api/admin/site-content)가 등록 키만 허용하므로 저장 안 됨
 * 서비스 CMS 확장 시 3곳(union·DEFAULTS·LABELS) 중 하나를 빠뜨리는 회귀를 막는다.
 */
import assert from "node:assert/strict";

import { SITE_SETTINGS_DEFAULTS, SITE_SETTINGS_LABELS } from "@/lib/services/site-settings";

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

const defaultKeys = new Set(Object.keys(SITE_SETTINGS_DEFAULTS));
const labelKeys = new Set(Object.keys(SITE_SETTINGS_LABELS));

check("DEFAULTS ↔ LABELS 키 집합 일치", () => {
  const onlyInDefaults = [...defaultKeys].filter((k) => !labelKeys.has(k));
  const onlyInLabels = [...labelKeys].filter((k) => !defaultKeys.has(k));
  assert.deepEqual(onlyInDefaults, [], `LABELS 누락(편집기 미노출): ${onlyInDefaults.join(", ")}`);
  assert.deepEqual(onlyInLabels, [], `DEFAULTS 누락(저장 불가): ${onlyInLabels.join(", ")}`);
});

check("서비스 5종 × 10필드 = 50 키 모두 존재", () => {
  const services = ["immigration", "appeal", "contract", "license", "corporate"];
  const fields = ["title", "tagline", "desc", "whoFor", "documents", "faq", "process", "deadlines", "outcomes", "risks"];
  for (const s of services) {
    for (const f of fields) {
      const key = `services.${s}.${f}`;
      assert.ok(defaultKeys.has(key), `DEFAULTS 누락: ${key}`);
      assert.ok(labelKeys.has(key), `LABELS 누락: ${key}`);
    }
  }
});

check("모든 LABEL 은 label 문자열을 가진다", () => {
  for (const [key, meta] of Object.entries(SITE_SETTINGS_LABELS)) {
    assert.ok(meta && typeof meta.label === "string" && meta.label.length > 0, `label 비어있음: ${key}`);
  }
});

if (failed > 0) {
  console.error(`[site-settings-parity] ${failed} 검사 실패`);
  process.exit(1);
}
console.log("[site-settings-parity] OK — DEFAULTS↔LABELS 키 정합·서비스 50키·라벨 존재.");
