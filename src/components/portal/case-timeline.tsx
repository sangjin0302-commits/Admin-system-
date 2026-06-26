/**
 * 의뢰인 포털 사건 타임라인 — 핵심 5단계 시각화.
 * 데이터: STATUS_PROGRESS 0-100% → 5단계 매핑.
 */

const STEPS = [
  { key: "intake", label: "접수", range: [0, 19] },
  { key: "consult", label: "상담·견적", range: [20, 39] },
  { key: "prepare", label: "자료 준비", range: [40, 69] },
  { key: "submit", label: "제출·대기", range: [70, 89] },
  { key: "close", label: "결과·마무리", range: [90, 100] }
] as const;

function currentStepIndex(progress: number): number {
  for (let i = 0; i < STEPS.length; i++) {
    const [lo, hi] = STEPS[i].range;
    if (progress >= lo && progress <= hi) return i;
  }
  return 0;
}

export function CaseTimeline({ progress, nextStep }: { progress: number; nextStep?: string | null }) {
  const activeIdx = currentStepIndex(progress);

  return (
    <div className="mt-4">
      {/* 스텝 dots */}
      <div className="relative flex items-center">
        {STEPS.map((step, i) => {
          const isDone = i < activeIdx;
          const isActive = i === activeIdx;
          return (
            <div key={step.key} className="relative flex-1">
              {/* 라인 (마지막 제외) */}
              {i < STEPS.length - 1 && (
                <div className="absolute left-1/2 top-3 h-px w-full bg-line" aria-hidden>
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-deep transition-all duration-500"
                    style={{ width: isDone ? "100%" : isActive ? "50%" : "0%" }}
                  />
                </div>
              )}
              {/* dot */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                    isDone
                      ? "border-gold-deep bg-gold-deep text-white"
                      : isActive
                        ? "border-gold-deep bg-gold text-primary shadow-floating ring-4 ring-gold/20"
                        : "border-line bg-surface text-text-muted"
                  }`}
                >
                  {isDone ? (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-[10px] font-bold transition-colors ${
                    isDone || isActive ? "text-primary" : "text-text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 진행률 + 다음 할 일 */}
      <div className="mt-5 rounded-lg border border-gold/30 bg-gold-soft/15 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-serif text-[11px] font-bold uppercase tracking-wider text-gold-deep">
            현재 진행률
          </span>
          <span className="font-mono text-sm font-bold text-gold-deep">{progress}%</span>
        </div>
        {nextStep && (
          <p className="mt-2 flex items-start gap-2 text-xs leading-6 text-text">
            <span className="mt-0.5 shrink-0 text-gold-deep">→</span>
            <span>{nextStep}</span>
          </p>
        )}
      </div>
    </div>
  );
}
