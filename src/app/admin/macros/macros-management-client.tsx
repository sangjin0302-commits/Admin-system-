"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

type MacroActionType = "send_kakao" | "send_email" | "update_status" | "create_task" | "add_note";
const ACTION_OPTIONS: Array<{ value: MacroActionType; label: string }> = [
  { value: "send_kakao", label: "카톡 발송" },
  { value: "send_email", label: "이메일 발송" },
  { value: "update_status", label: "상태 변경" },
  { value: "create_task", label: "과제 생성" },
  { value: "add_note", label: "메모 추가" },
];

type MacroStep = { action: MacroActionType; params: Record<string, unknown> };
type Macro = {
  id: string;
  name: string;
  description?: string;
  steps: MacroStep[];
  hotkey?: string;
  updatedAt: string;
};

export function MacrosManagementClient({ initialMacros }: { initialMacros: Macro[] }) {
  const [macros, setMacros] = useState<Macro[]>(initialMacros);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hotkey, setHotkey] = useState("");
  const [steps, setSteps] = useState<MacroStep[]>([]);
  const [caseId, setCaseId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<string | null>(null);

  function addStep() {
    setSteps((s) => [...s, { action: "add_note", params: { note: "" } }]);
  }

  function updateStep(idx: number, patch: Partial<MacroStep>) {
    setSteps((s) => s.map((st, i) => (i === idx ? { ...st, ...patch } : st)));
  }

  function removeStep(idx: number) {
    setSteps((s) => s.filter((_, i) => i !== idx));
  }

  async function save() {
    setError(null);
    try {
      const res = await fetch("/api/admin/macros", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description, hotkey, steps }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? `실패 (${res.status})`);
        return;
      }
      setMacros((m) => [data.macro, ...m]);
      setName("");
      setDescription("");
      setHotkey("");
      setSteps([]);
    } catch (err) {
      setError((err as Error).message ?? "저장 오류");
    }
  }

  async function remove(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/macros/${id}`, { method: "DELETE" });
    if (res.ok) setMacros((m) => m.filter((x) => x.id !== id));
  }

  async function testRun(id: string) {
    setRunResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/macros/${id}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: caseId || undefined, actorName: "test" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? `실행 실패 (${res.status})`);
        return;
      }
      setRunResult(
        (data.result?.results ?? [])
          .map((r: { ok: boolean; action: string; message: string }) => `${r.ok ? "OK" : "FAIL"} ${r.action} — ${r.message}`)
          .join("\n"),
      );
    } catch (err) {
      setError((err as Error).message ?? "실행 오류");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-3 p-6">
        <h3 className="text-lg font-semibold text-text-strong">새 매크로</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 (선택)"
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
        />
        <input
          value={hotkey}
          onChange={(e) => setHotkey(e.target.value)}
          placeholder="단축키 (예: ctrl+alt+1)"
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text">스텝</p>
            <button
              type="button"
              onClick={addStep}
              className="rounded-md border border-line px-2 py-1 text-xs text-text hover:bg-surface-muted"
            >
              + 스텝 추가
            </button>
          </div>
          {steps.map((s, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface-muted p-2">
              <div className="flex items-center gap-2">
                <select
                  value={s.action}
                  onChange={(e) => updateStep(i, { action: e.target.value as MacroActionType, params: {} })}
                  className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
                >
                  {ACTION_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="ml-auto text-xs text-danger hover:underline"
                >
                  삭제
                </button>
              </div>
              <textarea
                className="mt-2 w-full rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs"
                rows={3}
                placeholder='{"note":"..."} 형식의 JSON params'
                value={JSON.stringify(s.params)}
                onChange={(e) => {
                  try {
                    updateStep(i, { params: JSON.parse(e.target.value || "{}") });
                  } catch {
                    /* wait for valid */
                  }
                }}
              />
            </div>
          ))}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <button
          type="button"
          onClick={save}
          className="rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20"
          disabled={!name || steps.length === 0}
        >
          저장
        </button>
      </Card>

      <Card className="space-y-3 p-6">
        <h3 className="text-lg font-semibold text-text-strong">등록된 매크로</h3>
        <div className="text-xs text-text-muted">
          테스트 실행용 caseId (선택):
          <input
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            placeholder="case_..."
            className="ml-2 rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs"
          />
        </div>
        {macros.length === 0 && <p className="text-sm text-text-muted">등록된 매크로 없음</p>}
        <ul className="space-y-2">
          {macros.map((m) => (
            <li key={m.id} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text-strong">{m.name}</p>
                  {m.description && <p className="text-xs text-text-muted">{m.description}</p>}
                  <p className="mt-1 text-xs text-text-muted">
                    {m.steps.length} 스텝{m.hotkey ? ` · 단축키 ${m.hotkey}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => testRun(m.id)}
                    className="rounded-md border border-line px-2 py-1 text-xs hover:bg-surface-muted"
                  >
                    실행
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="rounded-md border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/10"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {runResult && (
          <pre className="whitespace-pre-wrap rounded-md border border-line bg-surface-muted p-3 text-xs">
            {runResult}
          </pre>
        )}
      </Card>
    </div>
  );
}
