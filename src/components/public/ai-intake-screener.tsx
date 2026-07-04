"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * 5단계 초기 상담 봇 (구조화 인테이크).
 * 답변 -> /api/public/ai-intake-screen -> Haiku가 생성한 JSON 결과를 카드로 렌더.
 */

type Answers = {
  category: string;
  timing: string;
  documents: string;
  goal: string;
  budget: string;
};

type ScreenResult = {
  confidence: number; // 0..100
  summary: string;
  category: string;
  estimateMin: number;
  estimateMax: number;
  currency?: string;
  requiredDocuments: string[];
  procedure: string[]; // 3 steps
};

const CATEGORY_OPTIONS = [
  { value: "visa", label: "비자·체류" },
  { value: "appeal", label: "행정심판·이의" },
  { value: "contract", label: "계약서·사실조사" },
  { value: "license", label: "인허가·창업" },
  { value: "other", label: "기타 행정민원" }
] as const;

const TIMING_OPTIONS = [
  { value: "today", label: "오늘 발생" },
  { value: "week", label: "1주 이내" },
  { value: "month", label: "1개월 이내" },
  { value: "before", label: "그 이전" }
] as const;

const DOC_OPTIONS = [
  { value: "yes", label: "예 (전부 있음)" },
  { value: "partial", label: "일부만" },
  { value: "no", label: "아니오" }
] as const;

const GOAL_OPTIONS = [
  { value: "urgent", label: "긴급 (수일 내)" },
  { value: "month", label: "1개월 이내" },
  { value: "flex", label: "유동적" }
] as const;

const BUDGET_OPTIONS = [
  { value: "under50", label: "~50만" },
  { value: "under100", label: "~100만" },
  { value: "under300", label: "~300만" },
  { value: "any", label: "상관없음" }
] as const;

const STEPS = [
  { key: "category", title: "어떤 분야인가요?", options: CATEGORY_OPTIONS },
  { key: "timing", title: "사안이 발생한 시점은?", options: TIMING_OPTIONS },
  { key: "documents", title: "관련 문서를 가지고 계신가요?", options: DOC_OPTIONS },
  { key: "goal", title: "언제까지 해결하고 싶으신가요?", options: GOAL_OPTIONS },
  { key: "budget", title: "예상 예산은?", options: BUDGET_OPTIONS }
] as const;

function formatKRW(v: number) {
  return `${(v / 10000).toLocaleString("ko-KR")}만원`;
}

export function AiIntakeScreener() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreenResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(final: Answers) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/ai-intake-screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(final)
      });
      const data = (await res.json()) as { ok: boolean; result?: ScreenResult; error?: string };
      if (!res.ok || !data.ok || !data.result) {
        setError(data.error ?? "분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setResult(data.result);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function choose(value: string) {
    const key = STEPS[step].key;
    const next = { ...answers, [key]: value } as Partial<Answers>;
    setAnswers(next);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      void submit(next as Answers);
    }
  }

  function reset() {
    setAnswers({});
    setStep(0);
    setResult(null);
    setError(null);
  }

  if (result) {
    const confidencePct = Math.max(0, Math.min(100, Math.round(result.confidence)));
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gold/30 bg-surface/95 p-6 shadow-panel sm:p-8">
          <p className="ethos-eyebrow">AI 초기 분석 결과</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-primary sm:text-3xl">
            {result.category}
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">{result.summary}</p>

          {/* 신뢰도 게이지 */}
          <div className="mt-6">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-text-muted">
              <span>분석 신뢰도</span>
              <span className="text-primary">{confidencePct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gold-soft/40">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>

          {/* 예상 견적 */}
          <div className="mt-6 rounded-xl border border-gold/30 bg-gold-soft/20 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gold-deep">예상 견적 범위</p>
            <p className="mt-1 font-serif text-xl font-bold text-primary">
              {formatKRW(result.estimateMin)} ~ {formatKRW(result.estimateMax)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              실제 견적은 사실관계 확인 후 확정됩니다.
            </p>
          </div>

          {/* 필요 서류 */}
          {result.requiredDocuments.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-bold text-primary">필요 서류</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-strong">
                {result.requiredDocuments.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 절차 미리보기 */}
          {result.procedure.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-bold text-primary">진행 절차</p>
              <ol className="mt-2 space-y-2">
                {result.procedure.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm text-text-strong">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/intake"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-md transition hover:bg-text-strong"
            >
              무료 검토 요청
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-lg border border-gold/40 bg-surface px-6 text-sm font-semibold text-primary transition hover:bg-gold-soft/30"
            >
              PDF 리포트 받기
            </button>
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-4 block w-full text-center text-xs text-text-muted underline"
          >
            처음부터 다시 진단
          </button>
        </div>
      </div>
    );
  }

  const current = STEPS[step];
  const progressPct = Math.round(((step + (loading ? 1 : 0)) / STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-gold/30 bg-surface/95 p-6 shadow-panel sm:p-8">
        <div className="mb-4 flex items-center justify-between text-xs font-semibold text-text-muted">
          <span>
            STEP {step + 1} / {STEPS.length}
          </span>
          <span className="text-primary">{progressPct}%</span>
        </div>
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gold-soft/40">
          <div
            className="h-full rounded-full bg-gold transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <h2 className="font-serif text-xl font-bold text-primary sm:text-2xl">{current.title}</h2>

        <div className="mt-6 flex flex-wrap gap-2">
          {current.options.map((opt) => {
            const selected = answers[current.key as keyof Answers] === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={loading}
                onClick={() => choose(opt.value)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? "border-primary bg-primary text-white"
                    : "border-gold/40 bg-surface text-primary hover:border-primary hover:bg-gold-soft/30"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {step > 0 && !loading && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="mt-6 text-xs text-text-muted underline"
          >
            ← 이전 질문
          </button>
        )}

        {loading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-text-muted">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            AI가 사안을 분석하고 있습니다...
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default AiIntakeScreener;
