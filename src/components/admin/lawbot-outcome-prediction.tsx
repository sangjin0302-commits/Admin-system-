import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LawbotResponse } from "@/lib/services/lawbot-case-analysis-types";

type Props = {
  snapshot: LawbotResponse;
};

function getGaugeTone(score: number): {
  barClass: string;
  labelClass: string;
  toneLabel: string;
} {
  const pct = score * 100;
  if (pct < 40) {
    return {
      barClass: "bg-red-500",
      labelClass: "text-red-700 bg-red-50 border-red-200",
      toneLabel: "어려움"
    };
  }
  if (pct < 70) {
    return {
      barClass: "bg-yellow-500",
      labelClass: "text-yellow-800 bg-yellow-50 border-yellow-200",
      toneLabel: "검토 필요"
    };
  }
  return {
    barClass: "bg-green-500",
    labelClass: "text-green-700 bg-green-50 border-green-200",
    toneLabel: "유리함"
  };
}

export function LawbotOutcomePrediction({ snapshot }: Props) {
  const pros = (snapshot.pros ?? []).slice(0, 5);
  const cons = (snapshot.cons ?? []).slice(0, 5);
  const strategy = snapshot.argument_strategy ?? [];
  const counter = snapshot.counter_argument_points ?? [];
  const rawScore = snapshot.confidence_score;
  const hasScore = typeof rawScore === "number";

  const hasAnyData =
    hasScore ||
    !!snapshot.confidence_label ||
    pros.length > 0 ||
    cons.length > 0 ||
    strategy.length > 0 ||
    counter.length > 0;

  if (!hasAnyData) {
    return (
      <Card className="p-5">
        <p className="ui-kicker">승소 가능성 예측</p>
        <p className="mt-3 text-sm text-text-muted">분석 데이터 부족</p>
      </Card>
    );
  }

  const score = hasScore ? Math.max(0, Math.min(1, rawScore as number)) : 0;
  const pct = Math.round(score * 100);
  const tone = getGaugeTone(score);
  const label = snapshot.confidence_label ?? tone.toneLabel;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="ui-kicker">승소 가능성 예측</p>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
            tone.labelClass
          )}
        >
          {label}
        </span>
      </div>

      {hasScore ? (
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-text">{pct}%</span>
            <span className="text-xs text-text-muted">신뢰도 게이지</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={cn("h-full rounded-full transition-all", tone.barClass)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-text-muted">신뢰도 점수 없음</p>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-green-700">✅ 유리한 논거</p>
          {pros.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-text">
              {pros.map((item, idx) => (
                <li key={`pros-${idx}`} className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-text-muted">없음</p>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700">⚠️ 불리한 논거</p>
          {cons.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-text">
              {cons.map((item, idx) => (
                <li key={`cons-${idx}`} className="flex gap-2">
                  <span className="text-red-600">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-text-muted">없음</p>
          )}
        </div>
      </div>

      {(strategy.length > 0 || counter.length > 0) && (
        <div className="mt-5 grid gap-4 border-t border-line pt-4 md:grid-cols-2">
          {strategy.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-text">논증 전략</p>
              <ul className="mt-2 space-y-1 text-sm text-text-muted">
                {strategy.map((item, idx) => (
                  <li key={`strategy-${idx}`}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
          {counter.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-text">반박 대응</p>
              <ul className="mt-2 space-y-1 text-sm text-text-muted">
                {counter.map((item, idx) => (
                  <li key={`counter-${idx}`}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
