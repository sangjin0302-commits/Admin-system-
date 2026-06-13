"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Card } from "@/components/ui/card";

type AnalyzeResult = {
  ok: true;
  requestId: string;
  summary: Record<string, unknown> | null;
  domain: Record<string, unknown> | null;
  scope: Record<string, unknown> | null;
  reviewRequired: boolean;
  mustVerify: string[];
  riskFlags: string[];
  caseOutlook: Record<string, unknown> | null;
  practitionerGuide: Record<string, unknown> | null;
  matchedSubtypes: string[];
};

type ErrorResult = { ok: false; error: string };

const SAMPLES = [
  "체류기간이 다음 달 만료인데 F-2 자격 변경 가능한지 알고 싶습니다.",
  "최근 사업장에 영업정지 처분이 통지되었습니다. 처분 사유는 위생 점검 결과 위반이고요. 행정심판을 검토하고 싶습니다.",
  "외국인 노동자 고용 허가가 보완 요청을 받았는데 미충족 요건이 명확하지 않습니다.",
  "용역 계약 분쟁이 있어 사실관계를 정리한 보고서가 필요합니다."
];

export function QuickCheckClient() {
  const [fact, setFact] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (fact.trim().length < 10) {
      setError("사안 내용을 10자 이상 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/public/quick-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fact: fact.trim() })
      });
      const data = (await res.json()) as AnalyzeResult | ErrorResult;
      if (!data.ok) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("일시적인 통신 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 입력 폼 */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="font-serif text-sm font-bold text-primary">
              사안 내용 <span className="text-gold-deep">*</span>
            </label>
            <textarea
              value={fact}
              onChange={(e) => setFact(e.target.value)}
              rows={6}
              maxLength={3000}
              placeholder="예: 체류기간 만료가 다가오는데 자격 변경이 가능한지 알고 싶습니다…"
              className="mt-2 w-full rounded-lg border border-gold/40 bg-surface px-4 py-3 text-sm leading-7 text-text-strong focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-text-muted">10~3000자 / 식별 가능한 개인정보는 입력하지 마세요.</p>
              <p className="text-xs text-text-muted">{fact.length} / 3000</p>
            </div>
          </div>

          {/* 샘플 */}
          <div>
            <p className="font-serif text-xs font-bold uppercase tracking-wider text-gold-deep">샘플</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SAMPLES.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFact(s)}
                  className="rounded-full border border-gold/30 bg-surface px-3 py-1 text-xs text-text-muted transition hover:border-gold hover:text-primary"
                >
                  예시 {i + 1}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 font-serif text-sm font-bold text-white shadow-sm transition hover:bg-text-strong disabled:opacity-50"
          >
            {loading ? "분석 중…" : "AI 사전 진단 시작"}
          </button>
        </form>
      </Card>

      {/* 결과 */}
      {result && <ResultDisplay result={result} />}
    </div>
  );
}

function ResultDisplay({ result }: { result: AnalyzeResult }) {
  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft font-serif text-sm font-bold text-gold-deep">
            ✓
          </span>
          <div>
            <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">Analysis Complete</p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-primary">사전 진단 결과</h2>
            <p className="mt-2 text-xs text-text-muted">요청 ID: {result.requestId}</p>
          </div>
        </div>
      </Card>

      {/* 매칭된 분야 */}
      {result.matchedSubtypes.length > 0 && (
        <Section title="추정 업무 분야">
          <div className="flex flex-wrap gap-2">
            {result.matchedSubtypes.map((s) => (
              <span
                key={s}
                className="rounded-full bg-primary px-4 py-1.5 font-serif text-xs font-bold text-white"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* 확인 필요 사항 */}
      {result.mustVerify.length > 0 && (
        <Section title="추가 확인이 필요한 사항">
          <ul className="space-y-2">
            {result.mustVerify.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-gold" />
                {m}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 위험 신호 */}
      {result.riskFlags.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 p-6">
          <h3 className="flex items-center gap-2 font-serif text-base font-bold text-amber-900">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            주의 신호
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-amber-900">
            {result.riskFlags.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-amber-700" />
                {f}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 검토 권고 */}
      {result.reviewRequired && (
        <Card muted className="border-l-4 border-l-gold p-5">
          <p className="font-serif text-sm font-bold text-primary">
            정확한 진행을 위해 관리자 검토를 권합니다
          </p>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            AI 사전 진단은 일반적 안내이며 개별 사안의 최종 판단이 아닙니다. 자료와 사실관계를 확인하기 위해 상담 신청을 부탁드립니다.
          </p>
        </Card>
      )}

      {/* CTA */}
      <Card className="bg-primary p-7 text-center text-white">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-soft">Next Step</p>
        <h3 className="mt-2 font-serif text-2xl font-bold">상담을 시작하시겠습니까?</h3>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/80">
          본 진단 결과를 바탕으로 사실관계와 자료를 함께 확인합니다.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/intake"
            className="inline-flex h-11 items-center rounded-lg bg-gold px-6 font-serif text-sm font-bold text-primary transition hover:bg-gold-soft"
          >
            상담 신청
          </Link>
          <Link
            href="/services"
            className="inline-flex h-11 items-center rounded-lg border-2 border-gold/50 px-6 font-serif text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
          >
            업무 분야 보기
          </Link>
        </div>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">{title}</p>
      <div className="mt-3">{children}</div>
    </Card>
  );
}
