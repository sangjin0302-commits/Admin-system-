"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { Card } from "@/components/ui/card";

// 분석은 20~40초 소요 — 사용자가 멈춘 것으로 오해하지 않도록 진행 메시지를 순환 표시
const PROGRESS_STEPS = [
  "사안을 이해하는 중입니다…",
  "관련 법령을 검색하는 중입니다…",
  "유사 판례·유권해석을 대조하는 중입니다…",
  "위험 신호와 확인 사항을 정리하는 중입니다…",
  "분석 결과를 종합하는 중입니다… (최대 40초 소요)"
];

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
  const [progressStep, setProgressStep] = useState(0);

  // 로딩 중 진행 메시지를 6초 간격으로 다음 단계로 넘김 (마지막 단계에서 정지)
  useEffect(() => {
    if (!loading) {
      setProgressStep(0);
      return;
    }
    const id = setInterval(() => {
      setProgressStep((prev) => Math.min(prev + 1, PROGRESS_STEPS.length - 1));
    }, 6000);
    return () => clearInterval(id);
  }, [loading]);

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
            {loading ? <span className="ethos-caret">분석 중</span> : "AI 사전 진단 시작"}
          </button>

          {loading && (
            <div className="rounded-lg border border-gold/30 bg-gold-soft/20 px-4 py-4" aria-live="polite">
              <div className="flex items-center gap-3">
                <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gold/40 border-t-gold-deep" aria-hidden />
                <p className="text-sm font-medium text-primary">{PROGRESS_STEPS[progressStep]}</p>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gold/15">
                <div
                  className="h-full rounded-full bg-gold-deep transition-all duration-1000 ease-out"
                  style={{ width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </form>
      </Card>

      {/* 결과 */}
      {result && <ResultDisplay result={result} />}
    </div>
  );
}

// 매칭 텍스트 → 키워드 추천 (블로그 keyword-linker와 동일 룰)
function suggestKeywords(text: string): Array<{ term: string; label: string }> {
  const RULES: Array<{ re: RegExp; term: string; label: string }> = [
    { re: /(D-?8|D8|기업투자)/i, term: "d-8-비자", label: "D-8 비자" },
    { re: /(D-?10|D10|구직비자)/i, term: "d-10-비자", label: "D-10 비자" },
    { re: /(F-?2-?7|F27|점수제)/i, term: "f-2-7-비자", label: "F-2-7 비자" },
    { re: /행정\s*심판|재결|청구기한/, term: "행정심판", label: "행정심판" },
    { re: /귀화|국적/, term: "귀화", label: "귀화 · 국적" },
    { re: /법인\s*설립|주식회사|정관/, term: "법인설립", label: "법인 설립" },
    { re: /강제\s*퇴거|출국명령/, term: "강제퇴거", label: "강제퇴거 대응" }
  ];
  const out: Array<{ term: string; label: string }> = [];
  for (const r of RULES) {
    if (r.re.test(text) && !out.find((o) => o.term === r.term)) {
      out.push({ term: r.term, label: r.label });
    }
  }
  return out.slice(0, 3);
}

function ResultDisplay({ result }: { result: AnalyzeResult }) {
  // 매칭 분야 → intake prefill 파라미터
  const topCat = result.matchedSubtypes[0] ?? "";
  const summary = [
    result.matchedSubtypes.length > 0 ? `추정 분야: ${result.matchedSubtypes.join(", ")}` : "",
    result.mustVerify.length > 0 ? `확인 필요: ${result.mustVerify.slice(0, 2).join(" · ")}` : "",
    result.riskFlags.length > 0 ? `주의: ${result.riskFlags.slice(0, 2).join(" · ")}` : ""
  ].filter(Boolean).join("\n");
  const prefillUrl = `/intake?from=quick-check&cat=${encodeURIComponent(topCat)}&summary=${encodeURIComponent(summary.slice(0, 300))}`;
  const keywords = suggestKeywords(`${result.matchedSubtypes.join(" ")} ${result.mustVerify.join(" ")} ${result.riskFlags.join(" ")}`);

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

      {/* 키워드 가이드 추천 */}
      {keywords.length > 0 && (
        <Card className="border-gold/30 bg-gold-soft/15 p-5">
          <p className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-deep">Recommended Guides</p>
          <h3 className="ethos-display mt-2 text-base">관련 키워드 가이드</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.map((k) => (
              <Link
                key={k.term}
                href={`/keyword/${encodeURIComponent(k.term)}`}
                data-funnel="quickcheck_to_keyword"
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-surface px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-gold-soft/40"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {k.label} →
              </Link>
            ))}
          </div>
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
            href={prefillUrl}
            data-funnel="quick_check_to_intake"
            data-funnel-cat={topCat}
            className="inline-flex h-11 items-center rounded-lg bg-gold px-6 font-serif text-sm font-bold text-primary transition hover:bg-gold-soft"
          >
            진단 결과로 상담 신청 →
          </Link>
          <Link
            href="/links"
            data-funnel="quick_check_to_channels"
            className="inline-flex h-11 items-center rounded-lg border-2 border-gold/50 px-6 font-serif text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
          >
            5채널 보기
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
