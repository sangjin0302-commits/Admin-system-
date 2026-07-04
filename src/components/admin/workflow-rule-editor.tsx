"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WorkflowRule, WorkflowAction } from "@/lib/services/workflow-engine";

const ACTION_TYPES = [
  { value: "sendTelegram", label: "텔레그램 전송" },
  { value: "sendEmail", label: "이메일 전송" },
  { value: "createReminder", label: "리마인더 생성" },
  { value: "requestDocuments", label: "자료 요청" },
  { value: "logNote", label: "노트 기록" }
] as const;

const INQUIRY_STATUSES = [
  "NEW", "PRE_DIAGNOSED", "CONSULTATION_REQUIRED", "QUOTE_DRAFTED",
  "QUOTE_PENDING", "ON_HOLD", "IN_REVIEW", "WAITING_CONSULTATION",
  "QUOTE_SENT", "WON", "CLOSED"
];

const CASE_STATUSES = [
  "INTAKE_REVIEW", "CONSULTING", "QUOTED", "CONTRACT_PENDING", "OPEN",
  "DOCUMENT_COLLECTING", "DOCUMENT_REVIEWING", "READY_TO_SUBMIT",
  "SUBMITTED", "SUPPLEMENT_REQUESTED", "WAITING_AGENCY", "RESULT_RECEIVED",
  "CLOSING", "CLOSED", "CANCELLED", "ON_HOLD"
];

export function WorkflowRuleEditor({ initialRules }: { initialRules: WorkflowRule[] }) {
  const [rules, setRules] = useState<WorkflowRule[]>(initialRules);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<WorkflowRule[] | null>(null);

  function updateRule(index: number, patch: Partial<WorkflowRule>) {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function updateTrigger(index: number, patch: Partial<WorkflowRule["trigger"]>) {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, trigger: { ...r.trigger, ...patch } } : r))
    );
  }

  function updateAction(ruleIndex: number, actionIndex: number, patch: Partial<WorkflowAction>) {
    setRules((prev) =>
      prev.map((r, i) => {
        if (i !== ruleIndex) return r;
        return {
          ...r,
          actions: r.actions.map((a, j) => (j === actionIndex ? { ...a, ...patch } : a))
        };
      })
    );
  }

  function addRule() {
    setRules((prev) => [
      ...prev,
      {
        id: `custom.${Date.now()}`,
        name: "새 규칙",
        enabled: true,
        trigger: { entity: "inquiry", toStatus: "NEW" },
        actions: []
      }
    ]);
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function addAction(ruleIndex: number) {
    setRules((prev) =>
      prev.map((r, i) => {
        if (i !== ruleIndex) return r;
        return { ...r, actions: [...r.actions, { type: "logNote", params: {} }] };
      })
    );
  }

  function removeAction(ruleIndex: number, actionIndex: number) {
    setRules((prev) =>
      prev.map((r, i) => {
        if (i !== ruleIndex) return r;
        return { ...r, actions: r.actions.filter((_, j) => j !== actionIndex) };
      })
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/workflows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "저장 실패");
      } else {
        setRules(data.rules);
        setMessage("저장되었습니다.");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(rule: WorkflowRule) {
    setTestResult(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: rule.trigger.entity,
          fromStatus: rule.trigger.fromStatus,
          toStatus: rule.trigger.toStatus
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "시뮬레이션 실패");
      } else {
        setTestResult(data.matched as WorkflowRule[]);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "네트워크 오류");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">총 {rules.length}개 규칙</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={addRule}>규칙 추가</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "전체 저장"}
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-md border border-line bg-surface-muted p-3 text-sm">{message}</div>
      )}

      {testResult !== null && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-medium">시뮬레이션 결과: {testResult.length}개 규칙 매칭</p>
          <ul className="mt-2 list-disc pl-5">
            {testResult.map((r, i) => (
              <li key={i}>
                {r.name ?? r.id} → {r.actions.map((a) => a.type).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rules.map((rule, i) => {
        const statuses =
          rule.trigger.entity === "inquiry" ? INQUIRY_STATUSES : CASE_STATUSES;
        return (
          <Card key={i} className="p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex-1">
                <input
                  className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold"
                  value={rule.name ?? ""}
                  onChange={(e) => updateRule(i, { name: e.target.value })}
                  placeholder="규칙 이름"
                />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={rule.enabled !== false}
                  onChange={(e) => updateRule(i, { enabled: e.target.checked })}
                />
                활성
              </label>
              <Button variant="secondary" size="sm" onClick={() => handleTest(rule)}>
                테스트
              </Button>
              <Button variant="secondary" size="sm" onClick={() => removeRule(i)}>
                삭제
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium">엔티티</label>
                <select
                  className="w-full rounded-md border border-line bg-white px-2 py-1 text-sm"
                  value={rule.trigger.entity}
                  onChange={(e) =>
                    updateTrigger(i, { entity: e.target.value as "inquiry" | "case" })
                  }
                >
                  <option value="inquiry">문의 (Inquiry)</option>
                  <option value="case">사건 (Case)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">이전 상태 (선택)</label>
                <select
                  className="w-full rounded-md border border-line bg-white px-2 py-1 text-sm"
                  value={rule.trigger.fromStatus ?? ""}
                  onChange={(e) =>
                    updateTrigger(i, { fromStatus: e.target.value || undefined })
                  }
                >
                  <option value="">(모든 상태)</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">이후 상태</label>
                <select
                  className="w-full rounded-md border border-line bg-white px-2 py-1 text-sm"
                  value={rule.trigger.toStatus}
                  onChange={(e) => updateTrigger(i, { toStatus: e.target.value })}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">액션 ({rule.actions.length})</p>
                <Button variant="secondary" size="sm" onClick={() => addAction(i)}>
                  액션 추가
                </Button>
              </div>
              {rule.actions.map((action, j) => (
                <div key={j} className="mb-2 rounded-md border border-line p-3">
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-md border border-line bg-white px-2 py-1 text-sm"
                      value={action.type}
                      onChange={(e) =>
                        updateAction(i, j, {
                          type: e.target.value as WorkflowAction["type"]
                        })
                      }
                    >
                      {ACTION_TYPES.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                    <Button variant="secondary" size="sm" onClick={() => removeAction(i, j)}>
                      제거
                    </Button>
                  </div>
                  <textarea
                    className="mt-2 w-full rounded-md border border-line bg-white px-2 py-1 font-mono text-xs"
                    rows={3}
                    value={JSON.stringify(action.params, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateAction(i, j, { params: parsed });
                      } catch {
                        // ignore parse errors while typing
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
