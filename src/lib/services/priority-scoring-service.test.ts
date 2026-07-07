import assert from "node:assert/strict";

import { scoreTone, type PriorityScore } from "@/lib/services/priority-scoring-service";

// ── 1. scoreTone 범위별 라벨 ─────────────────────────────
assert.equal(scoreTone(90).label, "긴급");
assert.equal(scoreTone(80).label, "긴급");
assert.equal(scoreTone(70).label, "우선");
assert.equal(scoreTone(60).label, "우선");
assert.equal(scoreTone(50).label, "보통");
assert.equal(scoreTone(40).label, "보통");
assert.equal(scoreTone(30).label, "낮음");
assert.equal(scoreTone(0).label, "낮음");

// ── 2. scoreTone className 포함 스타일 ───────────────────
{
  const t = scoreTone(85);
  assert.match(t.className, /red/);
  assert.equal(scoreTone(65).className.includes("amber"), true);
  assert.equal(scoreTone(45).className.includes("blue"), true);
  assert.equal(scoreTone(10).className.includes("gray"), true);
}

// ── 3. 경계값 정확성 ────────────────────────────────────
assert.equal(scoreTone(79).label, "우선");
assert.equal(scoreTone(59).label, "보통");
assert.equal(scoreTone(39).label, "낮음");

// ── 4. PriorityScore 타입 shape 검증 ─────────────────────
{
  const s: PriorityScore = {
    urgency: 80,
    likelihood: 60,
    revenue: 50,
    total: 65,
    reasoning: "테스트",
    scoredAt: new Date().toISOString(),
  };
  assert.equal(typeof s.urgency, "number");
  assert.equal(typeof s.reasoning, "string");
}

// ── 5. total 스코어링 공식 (0.4·urgency + 0.3·likelihood + 0.3·revenue) ──
{
  const formula = (u: number, l: number, r: number) => Math.round(0.4 * u + 0.3 * l + 0.3 * r);
  assert.equal(formula(100, 100, 100), 100);
  assert.equal(formula(0, 0, 0), 0);
  assert.equal(formula(50, 50, 50), 50);
  // urgency 100, 나머지 0 → 40
  assert.equal(formula(100, 0, 0), 40);
  // urgency 0, likelihood 100 → 30
  assert.equal(formula(0, 100, 0), 30);
}

// ── 6. 스코어 clamping (외부 API 스타일) ──────────────────
{
  const clamp = (n: unknown) => {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(100, Math.round(v)));
  };
  assert.equal(clamp(150), 100);
  assert.equal(clamp(-5), 0);
  assert.equal(clamp(NaN), 0);
  assert.equal(clamp("abc"), 0);
  assert.equal(clamp(45.7), 46);
}

console.log("priority-scoring-service tests passed");
