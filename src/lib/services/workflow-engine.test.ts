import assert from "node:assert/strict";

import {
  DEFAULT_WORKFLOW_RULES,
  type WorkflowRule,
  type WorkflowActionType,
} from "@/lib/services/workflow-engine";

// ── 1. DEFAULT_WORKFLOW_RULES 무결성 ──────────────────────
assert.ok(Array.isArray(DEFAULT_WORKFLOW_RULES));
assert.ok(DEFAULT_WORKFLOW_RULES.length >= 4);

// ── 2. 모든 규칙에 trigger + actions 존재 ─────────────────
for (const rule of DEFAULT_WORKFLOW_RULES) {
  assert.ok(rule.trigger, `rule ${rule.id} missing trigger`);
  assert.ok(rule.trigger.toStatus, "toStatus required");
  assert.ok(["inquiry", "case"].includes(rule.trigger.entity));
  assert.ok(Array.isArray(rule.actions) && rule.actions.length > 0);
}

// ── 3. NEW inquiry 트리거 규칙 검증 ───────────────────────
{
  const rule = DEFAULT_WORKFLOW_RULES.find(
    (r) => r.trigger.entity === "inquiry" && r.trigger.toStatus === "NEW"
  );
  assert.ok(rule, "새 문의 규칙이 존재해야 함");
  const actionTypes = rule.actions.map((a) => a.type);
  assert.ok(actionTypes.includes("sendTelegram"));
  assert.ok(actionTypes.includes("requestDocuments"));
}

// ── 4. CONSULTING case 리마인더 규칙 ──────────────────────
{
  const rule = DEFAULT_WORKFLOW_RULES.find(
    (r) => r.trigger.entity === "case" && r.trigger.toStatus === "CONSULTING"
  );
  assert.ok(rule);
  const reminder = rule.actions.find((a) => a.type === "createReminder");
  assert.ok(reminder);
  assert.equal(reminder.params.delayDays, 3);
}

// ── 5. 규칙 shape 검증 (수동 isValidRule 재현) ─────────────
function isValidRuleShape(v: unknown): v is WorkflowRule {
  if (!v || typeof v !== "object") return false;
  const r = v as WorkflowRule;
  if (!r.trigger || typeof r.trigger !== "object") return false;
  if (r.trigger.entity !== "inquiry" && r.trigger.entity !== "case") return false;
  if (typeof r.trigger.toStatus !== "string" || r.trigger.toStatus.length === 0) return false;
  if (!Array.isArray(r.actions)) return false;
  return true;
}

assert.equal(isValidRuleShape(null), false);
assert.equal(isValidRuleShape({}), false);
assert.equal(isValidRuleShape({ trigger: {}, actions: [] }), false);
assert.equal(
  isValidRuleShape({ trigger: { entity: "inquiry", toStatus: "NEW" }, actions: [] }),
  true
);
assert.equal(
  isValidRuleShape({ trigger: { entity: "other", toStatus: "X" }, actions: [] }),
  false
);

// ── 6. 알려진 action 타입만 사용 ──────────────────────────
const KNOWN: WorkflowActionType[] = [
  "sendTelegram",
  "sendEmail",
  "createReminder",
  "requestDocuments",
  "logNote",
];
for (const rule of DEFAULT_WORKFLOW_RULES) {
  for (const a of rule.actions) {
    assert.ok(KNOWN.includes(a.type), `unknown action type: ${a.type}`);
  }
}

// ── 7. id 유일성 ─────────────────────────────────────────
{
  const ids = DEFAULT_WORKFLOW_RULES.map((r) => r.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, "규칙 id는 유일해야 함");
}

// ── 8. WAITING_AGENCY - 매주 리마인더 ─────────────────────
{
  const rule = DEFAULT_WORKFLOW_RULES.find(
    (r) => r.trigger.toStatus === "WAITING_AGENCY"
  );
  assert.ok(rule);
  const rem = rule.actions.find((a) => a.type === "createReminder");
  assert.equal(rem?.params.recurring, "weekly");
}

// ── 9. enabled 기본값 true ────────────────────────────────
for (const rule of DEFAULT_WORKFLOW_RULES) {
  assert.notEqual(rule.enabled, false);
}

console.log("workflow-engine tests passed");
