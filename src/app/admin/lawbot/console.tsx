"use client";

import { useEffect, useState } from "react";

type CaseOption = { id: string; label: string };

type Citation = { name: string; url: string };
type Result = {
  summary: string | null;
  domain: string | null;
  scope: string | null;
  reviewRequired: boolean;
  mustVerify: string[];
  riskFlags: string[];
  caseOutlook: string | null;
  practitionerGuide: string | null;
  matchedSubtypes: string[];
  citations: Citation[];
};

export function LawbotConsole() {
  const [fact, setFact] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const [cases, setCases] = useState<CaseOption[]>([]);
  const [caseId, setCaseId] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/admin/case-matters/options")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) setCases(d.items ?? []);
      })
      .catch(() => {});
  }, []);

  async function saveToCase() {
    if (!caseId || !result) return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/admin/lawbot/save-to-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, analysis: result })
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }

  async function analyze() {
    if (fact.trim().length < 10) {
      setStatus("error");
      setError("사안 내용을 10자 이상 입력해 주세요.");
      return;
    }
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/lawbot/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fact })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult(data as Result);
        setStatus("done");
      } else {
        setStatus("error");
        setError(data.error ?? "분석에 실패했습니다.");
      }
    } catch {
      setStatus("error");
      setError("네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <textarea
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          rows={6}
          placeholder="예: 음식점 영업정지 2개월 처분을 받았습니다. 처분서는 3일 전 송달받았고…"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-7 focus:border-primary focus:outline-none"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={analyze}
            disabled={status === "loading"}
            className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-white transition hover:bg-[#143d5d] disabled:opacity-50"
          >
            {status === "loading" ? "분석 중…" : "분석하기"}
          </button>
          <span className="text-xs text-text-muted">{fact.length} / 6000자</span>
          {status === "error" && <span className="text-sm font-semibold text-rose-600">{error}</span>}
        </div>
      </div>

      {result && (
        <div className="space-y-4 border-t border-line pt-6">
          <div className="flex flex-wrap gap-2">
            {result.domain && (
              <span className="rounded-full bg-gold-soft/60 px-3 py-1 text-xs font-bold text-gold-deep">
                분야: {result.domain}
              </span>
            )}
            {result.scope && (
              <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-text-strong">
                범위: {result.scope}
              </span>
            )}
            {result.reviewRequired && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                담당자 검토 필요
              </span>
            )}
          </div>

          {result.summary && (
            <Block title="사안 요약">
              <p className="text-sm leading-7 text-text">{result.summary}</p>
            </Block>
          )}

          {result.caseOutlook && (
            <Block title="진행 전망">
              <p className="text-sm leading-7 text-text">{result.caseOutlook}</p>
            </Block>
          )}

          {result.practitionerGuide && (
            <Block title="실무 가이드">
              <p className="whitespace-pre-wrap text-sm leading-7 text-text">{result.practitionerGuide}</p>
            </Block>
          )}

          {result.mustVerify.length > 0 && (
            <Block title="반드시 확인할 사항">
              <ul className="space-y-1.5">
                {result.mustVerify.map((m, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-7 text-text">
                    <span className="text-gold-deep">•</span>
                    {m}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {result.riskFlags.length > 0 && (
            <Block title="리스크 플래그">
              <div className="flex flex-wrap gap-2">
                {result.riskFlags.map((r, i) => (
                  <span key={i} className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    {r}
                  </span>
                ))}
              </div>
            </Block>
          )}

          {result.citations.length > 0 && (
            <Block title="관련 법령">
              <ul className="space-y-1.5">
                {result.citations.map((c, i) => (
                  <li key={i}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      {c.name} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {/* 사건에 저장 */}
          <div className="rounded-[14px] border border-primary/20 bg-primary/5 p-4">
            <h3 className="text-sm font-bold text-primary">이 분석을 사건에 저장</h3>
            <p className="mt-1 text-xs text-text-muted">선택한 사건의 진행 기록(타임라인)에 분석 결과가 남습니다.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <select
                value={caseId}
                onChange={(e) => {
                  setCaseId(e.target.value);
                  setSaveState("idle");
                }}
                className="h-10 min-w-[16rem] rounded-lg border border-line bg-surface px-3 text-sm"
              >
                <option value="">사건 선택…</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={saveToCase}
                disabled={!caseId || saveState === "saving"}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d] disabled:opacity-50"
              >
                {saveState === "saving" ? "저장 중…" : "사건에 저장"}
              </button>
              {saveState === "saved" && <span className="text-sm font-semibold text-emerald-600">✓ 저장됨</span>}
              {saveState === "error" && <span className="text-sm font-semibold text-rose-600">저장 실패</span>}
              {cases.length === 0 && <span className="text-xs text-text-muted">등록된 사건이 없습니다.</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface-muted/30 p-4">
      <h3 className="text-sm font-bold text-gold-deep">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
