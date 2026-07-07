"use client";

import { useState } from "react";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flag";

const ALL_ACTIONS = [
  { key: "status_closed", label: "상태 → CLOSED" },
  { key: "closing_report", label: "AI 종결 리포트 생성" },
  { key: "final_invoice", label: "최종 인보이스 큐잉" },
  { key: "nps_survey", label: "NPS 설문 발송" },
  { key: "calendar_entry", label: "종결 캘린더 항목 등록" },
  { key: "archive_documents", label: "문서 아카이브" },
  { key: "reengagement_schedule", label: "90일 리인게이지 예약" },
] as const;

type ActionKey = (typeof ALL_ACTIONS)[number]["key"];

type StepResult = {
  action: string;
  ok: boolean;
  message: string;
};

export function OneClickCloseButton({ caseId }: { caseId: string }) {
  const flag = useFeatureFlag("one_click_close");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<ActionKey, boolean>>(() =>
    Object.fromEntries(ALL_ACTIONS.map((a) => [a.key, true])) as Record<ActionKey, boolean>,
  );
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StepResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (flag === false) return null;

  const toggle = (k: ActionKey) => setSelected((s) => ({ ...s, [k]: !s[k] }));

  async function run() {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const actions = ALL_ACTIONS.filter((a) => selected[a.key]).map((a) => a.key);
      const res = await fetch(`/api/admin/cases/${caseId}/close-flow`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actions, trigger: "admin.button" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? `실패 (${res.status})`);
      } else {
        setResults(data.result?.actions ?? []);
      }
    } catch (err) {
      setError((err as Error).message ?? "네트워크 오류");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setResults(null);
          setError(null);
        }}
        className="inline-flex h-10 items-center rounded-lg border border-warning/40 bg-warning/10 px-4 text-sm font-semibold text-warning transition hover:bg-warning/20"
      >
        사건 종결 (원클릭)
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-panel">
            <h3 className="text-lg font-semibold text-text-strong">원클릭 사건 종결</h3>
            <p className="mt-1 text-sm text-text-muted">
              선택된 항목이 순차 실행됩니다. 각 항목은 독립적으로 성공/실패 처리됩니다.
            </p>
            <ul className="mt-4 space-y-2">
              {ALL_ACTIONS.map((a) => (
                <li key={a.key}>
                  <label className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={selected[a.key]}
                      onChange={() => toggle(a.key)}
                      disabled={running}
                    />
                    <span>{a.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            {results && (
              <ul className="mt-4 space-y-1 rounded-lg border border-line bg-surface-muted p-3 text-xs">
                {results.map((r, i) => (
                  <li key={i} className={r.ok ? "text-success" : "text-danger"}>
                    <span className="font-mono">{r.ok ? "OK" : "FAIL"}</span> · {r.action} — {r.message}
                  </li>
                ))}
              </ul>
            )}
            {error && (
              <p className="mt-3 rounded-md border border-danger/40 bg-danger/10 p-2 text-xs text-danger">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm text-text hover:bg-surface-muted"
                onClick={() => setOpen(false)}
                disabled={running}
              >
                닫기
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-lg border border-warning/40 bg-warning/20 px-3 text-sm font-semibold text-warning hover:bg-warning/30 disabled:opacity-50"
                onClick={run}
                disabled={running}
              >
                {running ? "실행 중..." : "실행"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
