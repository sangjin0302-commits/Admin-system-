/**
 * 기능 플래그 잠금 계약 테스트.
 *
 * 잠금(locked)의 목적은 "실동작을 확인한 기능이 화면 클릭 한 번으로
 * 꺼지는 것"을 막는 것이다. 그래서 아래를 코드로 못 박는다.
 *
 *   1. 잠근 기능 목록이 실수로 줄어들지 않을 것
 *   2. 잠긴 기능은 setFeatureEnabled 로 변경되지 않을 것
 *   3. 잠긴 기능에는 잠근 이유(lockReason)가 반드시 있을 것
 *      — 이유 없는 잠금은 나중에 아무도 풀지 못한다
 */

import assert from "node:assert/strict";

/**
 * 실동작을 확인해 잠근 기능들.
 * 여기서 키를 빼려면 그 기능을 다시 검증했다는 뜻이어야 한다.
 */
const MUST_BE_LOCKED = [
  // 법제처(Lightsail 프록시) 계열 — 2026-07-19 실호출 확인(status=ok)
  "public_law_search",
  "admin_law_copilot",
  "law_health_check",
  "case_auto_research",
  "admin_easylaw",
  "case_research_verify_citations",
  // 노션 연동 안정화
  "ai_chatbot_rag"
];

async function main() {
  const mod = await import("./feature-flags-service");
  const registry = mod.FEATURE_REGISTRY as ReadonlyArray<{
    key: string;
    locked?: boolean;
    lockReason?: string;
  }>;

  const byKey = new Map(registry.map((f) => [f.key, f]));

  // ── 1) 잠겨 있어야 할 기능이 실제로 잠겨 있는가 ──
  for (const key of MUST_BE_LOCKED) {
    const def = byKey.get(key);
    assert.ok(def, `플래그가 사라졌다: ${key}`);
    assert.equal(def.locked, true, `잠금이 풀렸다: ${key}`);
    assert.ok(
      def.lockReason && def.lockReason.trim().length > 0,
      `잠금 이유가 없다: ${key} — 이유 없는 잠금은 나중에 아무도 풀 수 없다`
    );
  }

  // ── 2) 잠긴 기능은 변경 시도가 거부되는가 ──
  let threw = false;
  try {
    await mod.setFeatureEnabled("public_law_search", false);
  } catch {
    threw = true;
  }
  assert.ok(threw, "잠긴 기능인데 setFeatureEnabled 가 통과했다");

  // ── 3) 잠긴 기능 전체가 이유를 갖고 있는가 ──
  for (const def of registry) {
    if (!def.locked) continue;
    assert.ok(
      def.lockReason && def.lockReason.trim().length > 0,
      `잠금 이유가 없다: ${def.key}`
    );
  }

  const lockedCount = registry.filter((f) => f.locked).length;
  console.log(`feature flag lock tests passed (locked: ${lockedCount})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
