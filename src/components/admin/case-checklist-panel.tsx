"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { Card } from "@/components/ui/card";

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  dueDayOffset: number;
  requiredDocuments: string[];
}

interface Checklist {
  category: string;
  steps: ChecklistStep[];
  generatedAt: string;
  provider: "claude-haiku" | "template";
}

interface StoredChecklistState {
  checklist: Checklist;
  doneIds: string[];
  updatedAt: string;
}

export function CaseChecklistPanel({ caseId }: { caseId: string }) {
  const [state, setState] = useState<StoredChecklistState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadPending, startLoad] = useTransition();
  const [genPending, startGen] = useTransition();
  const [savePending, startSave] = useTransition();

  const load = useCallback(() => {
    setError(null);
    startLoad(async () => {
      try {
        const res = await fetch(`/api/admin/cases/${caseId}/checklist`);
        if (res.status === 404) {
          setState(null);
          return;
        }
        if (!res.ok) throw new Error(`Load failed (${res.status})`);
        const data = (await res.json()) as { ok?: boolean; state?: StoredChecklistState };
        setState(data.state ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "체크리스트 로드 실패");
      }
    });
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = () => {
    setError(null);
    startGen(async () => {
      try {
        const res = await fetch(`/api/admin/cases/${caseId}/checklist`, { method: "POST" });
        const data = (await res.json()) as { ok?: boolean; state?: StoredChecklistState; error?: string; message?: string };
        if (!res.ok || !data.ok || !data.state) throw new Error(data.error ?? data.message ?? "생성 실패");
        setState(data.state);
      } catch (e) {
        setError(e instanceof Error ? e.message : "체크리스트 생성 실패");
      }
    });
  };

  const toggleDone = (stepId: string) => {
    if (!state) return;
    const doneIds = state.doneIds.includes(stepId)
      ? state.doneIds.filter((id) => id !== stepId)
      : [...state.doneIds, stepId];
    const optimistic: StoredChecklistState = { ...state, doneIds };
    setState(optimistic);

    startSave(async () => {
      try {
        const res = await fetch(`/api/admin/cases/${caseId}/checklist`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checklist: optimistic.checklist, doneIds })
        });
        if (!res.ok) throw new Error(`Save failed (${res.status})`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장 실패");
        // revert
        setState(state);
      }
    });
  };

  const progress = useMemo(() => {
    if (!state) return 0;
    const total = state.checklist.steps.length;
    if (total === 0) return 0;
    return Math.round((state.doneIds.length / total) * 100);
  }, [state]);

  const exportPdfUrl = `/api/admin/cases/${caseId}/checklist/pdf`;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">사건 체크리스트</p>
          <p className="mt-1 text-xs text-text-muted">
            사건 유형에 맞춘 단계별 체크리스트. 완료 체크와 클라이언트 전달용 PDF 내보내기 지원.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            onClick={handleGenerate}
            disabled={genPending}
          >
            {genPending ? "생성 중…" : state ? "다시 생성" : "체크리스트 생성"}
          </button>
          {state && (
            <a
              href={exportPdfUrl}
              className="rounded-md border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-black/5"
              target="_blank"
              rel="noreferrer"
            >
              PDF 내보내기
            </a>
          )}
        </div>
      </div>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {loadPending && !state && <p className="mt-3 text-xs text-text-muted">로드 중…</p>}

      {state && (
        <>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>진행률</span>
              <span>
                {state.doneIds.length} / {state.checklist.steps.length} ({progress}%)
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-text-muted">
              엔진: {state.checklist.provider === "claude-haiku" ? "Claude Haiku 맞춤화" : "기본 템플릿"} · 저장 시각:{" "}
              {new Date(state.updatedAt).toLocaleString()}
            </p>
          </div>

          <ul className="mt-4 space-y-2">
            {state.checklist.steps.map((step) => {
              const done = state.doneIds.includes(step.id);
              return (
                <li
                  key={step.id}
                  className={`rounded-md border p-3 ${done ? "border-emerald-300 bg-emerald-50/50" : "border-border/60 bg-white/30"}`}
                >
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={done}
                      disabled={savePending}
                      onChange={() => toggleDone(step.id)}
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-semibold ${done ? "line-through text-text-muted" : ""}`}>
                          {step.title}
                        </span>
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-text-muted">
                          D+{step.dueDayOffset}
                        </span>
                      </div>
                      {step.description && (
                        <p className="mt-1 text-xs text-text-muted">{step.description}</p>
                      )}
                      {step.requiredDocuments.length > 0 && (
                        <p className="mt-1 text-[11px] text-text-muted">
                          필요 서류: {step.requiredDocuments.join(", ")}
                        </p>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
