"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DraftKind = "opinion" | "appeal" | "objection" | "petition";

const DRAFT_KIND_OPTIONS: {
  value: DraftKind;
  label: string;
  avgMinutes: number;
  checklist: string[];
}[] = [
  {
    value: "opinion",
    label: "의견서",
    avgMinutes: 25,
    checklist: [
      "사실관계 요약",
      "쟁점 정리",
      "적용 법령",
      "결론 (요청 사항)"
    ]
  },
  {
    value: "appeal",
    label: "행정심판청구서",
    avgMinutes: 45,
    checklist: [
      "청구인/피청구인 정보",
      "처분 내용 특정",
      "청구 취지",
      "청구 이유",
      "관계 법령",
      "증거 서류 목록"
    ]
  },
  {
    value: "objection",
    label: "이의신청서",
    avgMinutes: 30,
    checklist: [
      "처분 통지 수령일",
      "이의 사유",
      "요청 사항",
      "첨부 서류"
    ]
  },
  {
    value: "petition",
    label: "청원서",
    avgMinutes: 20,
    checklist: [
      "청원인 인적사항",
      "청원 대상 기관",
      "청원 사유",
      "요청 사항"
    ]
  }
];

type ApiResponse = {
  ok: boolean;
  draft?: string | null;
  sections?: unknown;
  warnings?: string[];
  error?: string;
};

type Step = 1 | 2 | 3;

export function LawbotDocumentDraftPanel({ inquiryId }: { inquiryId: string }) {
  const [step, setStep] = useState<Step>(1);
  const [draftKind, setDraftKind] = useState<DraftKind>("opinion");
  const [extraContext, setExtraContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [draftText, setDraftText] = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    citations: Array<{ raw: string; normalized: string; status: string; note?: string; kind: string; offset: number }>;
    summary: { total: number; verified: number; unknown: number; deprecated: number };
  } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateBusy, setGateBusy] = useState(false);
  const [gateResult, setGateResult] = useState<{
    passed: boolean;
    blockers: Array<{ code: string; message: string }>;
    warnings: Array<{ code: string; message: string }>;
  } | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);

  const activeOption = DRAFT_KIND_OPTIONS.find((o) => o.value === draftKind)!;

  async function runGate(): Promise<boolean> {
    if (!draftText.trim()) return false;
    setGateBusy(true);
    setGateError(null);
    try {
      const res = await fetch("/api/admin/document/verify-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draftText }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setGateError(data.error ?? "게이트 실행 실패");
        setGateResult(null);
        return false;
      }
      setGateResult({ passed: data.passed, blockers: data.blockers, warnings: data.warnings });
      return Boolean(data.passed);
    } catch (err) {
      setGateError(err instanceof Error ? err.message : "네트워크 오류");
      return false;
    } finally {
      setGateBusy(false);
    }
  }

  async function guardedExport() {
    setGateOpen(true);
    const ok = await runGate();
    if (!ok) return; // blocker → 저장/내보내기 차단
    await handleExportDocx();
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/draft-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftKind,
          extraContext: extraContext.trim() || undefined
        })
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        setError(data.error ?? "AI 서면 초안 생성에 실패했습니다.");
      } else {
        setResult(data);
        setDraftText(data.draft ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCitations() {
    if (!draftText.trim()) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/document/verify-citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draftText }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "인용 검증 실패");
      } else {
        setVerifyResult({ citations: data.citations, summary: data.summary });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setVerifying(false);
    }
  }

  async function handleCopy() {
    if (!draftText) return;
    try {
      await navigator.clipboard.writeText(draftText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("클립보드 복사에 실패했습니다.");
    }
  }

  async function handleExportDocx() {
    if (!draftText.trim()) return;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/inquiries/${inquiryId}/draft-document/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftText, documentType: draftKind })
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "다운로드 실패" }));
        setError(data.error ?? "docx 내보내기 실패");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeOption.label}-${inquiryId}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
      <Card className="p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted">Lawbot AI · 3단계 마법사</p>
            <h3 className="text-sm font-semibold text-text-strong">AI 서면 초안 생성</h3>
          </div>
          <StepIndicator step={step} />
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-strong">
                서면 종류
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DRAFT_KIND_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDraftKind(opt.value)}
                    className={
                      "rounded-md border px-3 py-2 text-sm transition " +
                      (draftKind === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-line bg-white text-text-strong hover:bg-surface-muted")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-strong">
                추가 사실관계 (선택)
              </label>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                rows={5}
                placeholder="문의에 포함되지 않은 추가 사실이나 강조할 쟁점을 입력하세요."
                className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="primary" size="md" onClick={() => setStep(2)}>
                다음: 초안 생성 →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted">
              선택: <b>{activeOption.label}</b>
            </p>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              variant="primary"
              size="md"
            >
              {loading ? "생성 중..." : result ? "다시 생성" : "AI 초안 생성"}
            </Button>

            {result?.warnings && result.warnings.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-medium">확인 필요:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {result && (
              <div>
                <p className="mb-2 text-xs font-medium text-text-strong">
                  초안 (편집 가능)
                </p>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  rows={16}
                  className="w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-xs"
                />
              </div>
            )}

            {result && (
              <div>
                <Button variant="secondary" size="md" onClick={handleVerifyCitations} disabled={verifying || !draftText.trim()}>
                  {verifying ? "검증 중..." : "인용 검증"}
                </Button>
                {verifyResult && (
                  <div className="mt-2 rounded-md border border-line bg-surface-muted p-3 text-xs">
                    <p className="font-semibold">
                      총 {verifyResult.summary.total}건 · 확인 {verifyResult.summary.verified} · 미확인 {verifyResult.summary.unknown} · 폐지 {verifyResult.summary.deprecated}
                    </p>
                    {verifyResult.citations.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {verifyResult.citations.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span
                              className={
                                "inline-block rounded px-1.5 py-0.5 font-semibold " +
                                (c.status === "verified"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : c.status === "deprecated"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700")
                              }
                            >
                              {c.status}
                            </span>
                            <span>
                              <span className="font-mono">{c.normalized}</span>
                              {c.note && <span className="ml-2 text-text-muted">{c.note}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="secondary" size="md" onClick={() => setStep(1)}>
                ← 이전
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(3)}
                disabled={!draftText.trim()}
              >
                다음: 저장/내보내기 →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-text-strong">최종 결과를 저장하거나 내보냅니다.</p>
            <div className="rounded-md border border-line bg-surface-muted p-3">
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-text-strong">
                {draftText}
              </pre>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="md" onClick={handleCopy}>
                {copied ? "복사됨" : "복사하기"}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={guardedExport}
                disabled={exporting || gateBusy}
              >
                {exporting ? "생성 중..." : gateBusy ? "게이트 검증 중..." : "게이트 통과 후 .docx 다운로드"}
              </Button>
              <Button variant="secondary" size="md" onClick={() => setStep(2)}>
                ← 편집으로
              </Button>
            </div>

            <div className="rounded-md border border-line bg-white">
              <button
                type="button"
                onClick={() => {
                  setGateOpen((v) => !v);
                  if (!gateOpen && !gateResult) void runGate();
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-text-strong"
              >
                <span>
                  발송 전 인용 검증
                  {gateResult && (
                    <span
                      className={
                        "ml-2 rounded px-1.5 py-0.5 text-xs font-semibold " +
                        (gateResult.passed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700")
                      }
                    >
                      {gateResult.passed ? "통과" : `차단 ${gateResult.blockers.length}건`}
                    </span>
                  )}
                </span>
                <span className="text-text-muted">{gateOpen ? "▲" : "▼"}</span>
              </button>
              {gateOpen && (
                <div className="border-t border-line px-3 py-3 text-xs">
                  <div className="mb-2 flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={runGate} disabled={gateBusy}>
                      {gateBusy ? "검증 중..." : "다시 검증"}
                    </Button>
                    <span className="text-text-muted">
                      폐지 조문은 자동 차단, 미확인 인용은 경고
                    </span>
                  </div>
                  {gateError && (
                    <p className="rounded bg-rose-50 p-2 text-rose-700">{gateError}</p>
                  )}
                  {gateResult && (
                    <div className="space-y-2">
                      {gateResult.blockers.length > 0 && (
                        <div>
                          <p className="font-semibold text-rose-700">차단 항목</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-rose-800">
                            {gateResult.blockers.map((b, i) => (
                              <li key={`b-${i}`}>{b.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {gateResult.warnings.length > 0 && (
                        <div>
                          <p className="font-semibold text-amber-700">경고</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-amber-800">
                            {gateResult.warnings.map((w, i) => (
                              <li key={`w-${i}`}>{w.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {gateResult.passed && gateResult.warnings.length === 0 && (
                        <p className="text-emerald-700">모든 인용이 확인되었습니다.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}
      </Card>

      <aside className="space-y-3">
        <Card className="p-3">
          <p className="ui-kicker">관련 사례 (Lawbot)</p>
          <p className="mt-1 text-xs text-text-muted">
            검색 결과는 Step 2에서 초안 생성 시 자동 반영됩니다.
          </p>
        </Card>
        <Card className="p-3">
          <p className="ui-kicker">체크리스트 ({activeOption.label})</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-text-strong">
            {activeOption.checklist.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-3">
          <p className="ui-kicker">예상 소요 시간</p>
          <p className="mt-1 text-lg font-semibold text-text-strong">
            약 {activeOption.avgMinutes}분
          </p>
          <p className="text-xs text-text-muted">AI 생성 + 검토 평균</p>
        </Card>
      </aside>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [1, 2, 3] as const;
  return (
    <div className="flex items-center gap-1">
      {steps.map((s) => (
        <span
          key={s}
          className={
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold " +
            (s === step
              ? "bg-primary text-white"
              : s < step
                ? "bg-emerald-500 text-white"
                : "bg-surface-muted text-text-muted")
          }
        >
          {s}
        </span>
      ))}
    </div>
  );
}
