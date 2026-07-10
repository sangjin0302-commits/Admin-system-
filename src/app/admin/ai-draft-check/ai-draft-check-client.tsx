"use client";

import { useState } from "react";

type Violation = {
  phrase: string;
  position: number;
  length: number;
  reason: string;
  severity: "error" | "warn";
  suggestion?: string;
};

export function AiDraftCheckClient({ guidelineVersion }: { guidelineVersion: string | null }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "done" | "error">("idle");
  const [violations, setViolations] = useState<Violation[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [checkedVersion, setCheckedVersion] = useState<string | null>(null);

  async function handleCheck() {
    if (!text.trim()) return;
    setStatus("checking");
    setMessage(null);
    setViolations(null);
    try {
      const res = await fetch("/api/admin/ai-draft-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        violations?: Violation[];
        guidelineVersion?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "검증 실패");
        return;
      }
      setViolations(data.violations ?? []);
      setCheckedVersion(data.guidelineVersion ?? guidelineVersion);
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("네트워크 오류");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="draft-text" className="block text-sm font-semibold text-text-strong">
          AI 초안 붙여넣기
        </label>
        <textarea
          id="draft-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="AI가 생성한 초안 문안을 여기에 붙여넣으세요."
          className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-text-muted">{text.length.toLocaleString()} 자</p>
      </div>

      <div className="flex items-center gap-4 border-t border-line pt-4">
        <button
          type="button"
          onClick={handleCheck}
          disabled={status === "checking" || !text.trim()}
          className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-white transition hover:bg-[#143d5d] disabled:opacity-50"
        >
          {status === "checking" ? "검증 중…" : "지침 검증"}
        </button>
        {status === "error" && (
          <span className="text-sm font-semibold text-rose-600">{message}</span>
        )}
      </div>

      {status === "done" && violations && (
        <div className="rounded-lg border border-line p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-base font-semibold text-text-strong">
              검증 결과 · {violations.length}건 감지
            </h3>
            {checkedVersion && (
              <span className="text-xs text-text-muted">
                기준 지침: <span className="font-mono text-primary">{checkedVersion}</span>
              </span>
            )}
          </div>
          {violations.length === 0 ? (
            <p className="text-sm text-emerald-600">
              위반 문구가 감지되지 않았습니다. 지침에 맞는 초안입니다.
            </p>
          ) : (
            <ul className="space-y-3">
              {violations.map((v, i) => (
                <li
                  key={`${v.position}-${i}`}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    v.severity === "error"
                      ? "border-rose-200 bg-rose-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
                        v.severity === "error"
                          ? "bg-rose-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {v.severity === "error" ? "차단" : "경고"}
                    </span>
                    <span className="font-mono text-text-strong">「{v.phrase}」</span>
                    <span className="text-xs text-text-muted">pos {v.position}</span>
                  </div>
                  <p className="mt-1 text-text-strong">{v.reason}</p>
                  {v.suggestion && (
                    <p className="mt-1 text-text-muted">
                      제안 대체: <span className="font-semibold">{v.suggestion}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
