"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

// 기준 요율 — /fees 및 quote-guidance-service.ts BASE_RATES와 정합성 유지.
// 각 분야의 대표 min/max 범위(KRW)를 기준값으로 사용합니다.
type CategoryKey =
  | "VISA_STAY"
  | "ADMIN_APPEAL"
  | "LICENSE_PERMIT"
  | "CORPORATE"
  | "CONTRACT_INVESTIGATION";

const CATEGORIES: readonly {
  key: CategoryKey;
  label: string;
  base: { min: number; max: number };
}[] = [
  { key: "VISA_STAY", label: "비자·체류", base: { min: 500_000, max: 3_000_000 } },
  { key: "ADMIN_APPEAL", label: "행정심판·불복", base: { min: 1_000_000, max: 6_000_000 } },
  { key: "LICENSE_PERMIT", label: "인허가·등록", base: { min: 800_000, max: 3_000_000 } },
  { key: "CORPORATE", label: "법인·사업", base: { min: 1_000_000, max: 2_500_000 } },
  { key: "CONTRACT_INVESTIGATION", label: "계약·사실조사", base: { min: 300_000, max: 3_000_000 } },
];

const COMPLEXITY: readonly {
  key: "simple" | "normal" | "complex";
  label: string;
  desc: string;
  mult: number;
}[] = [
  { key: "simple", label: "간단", desc: "단일 처분·표준 절차, 자료가 대체로 갖춰진 경우", mult: 0.8 },
  { key: "normal", label: "보통", desc: "일반적인 검토·서면 작성이 필요한 경우", mult: 1.0 },
  { key: "complex", label: "복잡", desc: "다수 처분·추가 법령 검토·쟁점이 많은 경우", mult: 1.4 },
];

const URGENCY: readonly {
  key: "normal" | "urgent";
  label: string;
  desc: string;
  mult: number;
}[] = [
  { key: "normal", label: "일반", desc: "통상 일정으로 진행", mult: 1.0 },
  { key: "urgent", label: "급함 (기한 임박)", desc: "우선 처리 요청 — 약 20% 가산", mult: 1.2 },
];

const manwonFormatter = new Intl.NumberFormat("ko-KR");

function formatKrw(value: number): string {
  const man = Math.round(value / 10000);
  return `${manwonFormatter.format(man)}만원`;
}

export function PricingCalculator() {
  const [categoryKey, setCategoryKey] = useState<CategoryKey>(CATEGORIES[0].key);
  const [complexityKey, setComplexityKey] = useState<"simple" | "normal" | "complex">("normal");
  const [urgencyKey, setUrgencyKey] = useState<"normal" | "urgent">("normal");

  const category = CATEGORIES.find((c) => c.key === categoryKey) ?? CATEGORIES[0];
  const complexity = COMPLEXITY.find((c) => c.key === complexityKey) ?? COMPLEXITY[1];
  const urgency = URGENCY.find((u) => u.key === urgencyKey) ?? URGENCY[0];

  const range = useMemo(() => {
    const mult = complexity.mult * urgency.mult;
    return {
      min: Math.round(category.base.min * mult),
      max: Math.round(category.base.max * mult),
    };
  }, [category, complexity, urgency]);

  const intakeHref = `/intake?cat=${encodeURIComponent(category.key)}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      {/* INPUTS */}
      <div className="ethos-card p-7 sm:p-9">
        {/* Step 1 — 업무 분야 */}
        <fieldset>
          <legend className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
            STEP 01 · 업무 분야
          </legend>
          <h3 className="ethos-display mt-2 text-xl">어떤 도움이 필요하신가요?</h3>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {CATEGORIES.map((c) => {
              const active = c.key === categoryKey;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategoryKey(c.key)}
                  aria-pressed={active}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 ${
                    active
                      ? "border-gold bg-gold-soft/40 text-primary"
                      : "border-gold/20 bg-surface text-text hover:border-gold/50 hover:bg-gold-soft/20"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Step 2 — 복잡도 */}
        <fieldset className="mt-9">
          <legend className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
            STEP 02 · 사안 복잡도
          </legend>
          <div className="mt-4 space-y-2.5">
            {COMPLEXITY.map((c) => {
              const active = c.key === complexityKey;
              return (
                <label
                  key={c.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-200 ${
                    active
                      ? "border-gold bg-gold-soft/40"
                      : "border-gold/20 bg-surface hover:border-gold/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="complexity"
                    value={c.key}
                    checked={active}
                    onChange={() => setComplexityKey(c.key)}
                    className="mt-1 h-4 w-4 accent-[color:var(--color-gold-deep,#a5843f)]"
                  />
                  <span>
                    <span className="block text-sm font-bold text-primary">{c.label}</span>
                    <span className="mt-0.5 block text-xs leading-6 text-text-muted">{c.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Step 3 — 긴급도 */}
        <fieldset className="mt-9">
          <legend className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
            STEP 03 · 긴급도
          </legend>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {URGENCY.map((u) => {
              const active = u.key === urgencyKey;
              return (
                <label
                  key={u.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-200 ${
                    active
                      ? "border-gold bg-gold-soft/40"
                      : "border-gold/20 bg-surface hover:border-gold/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={u.key}
                    checked={active}
                    onChange={() => setUrgencyKey(u.key)}
                    className="mt-1 h-4 w-4 accent-[color:var(--color-gold-deep,#a5843f)]"
                  />
                  <span>
                    <span className="block text-sm font-bold text-primary">{u.label}</span>
                    <span className="mt-0.5 block text-xs leading-6 text-text-muted">{u.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* LIVE OUTPUT */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 ethos-dark-card p-8 shadow-floating sm:p-10">
          <p className="ethos-eyebrow text-gold-soft">Estimated Fee</p>
          <p className="mt-3 text-xs leading-6 text-white/70">
            {category.label} · {complexity.label} · {urgency.label}
          </p>

          <p className="mt-6 text-sm text-white/70">예상 수임료 범위</p>
          <p className="mt-2 font-serif text-3xl font-bold text-white sm:text-4xl">
            {formatKrw(range.min)}
            <span className="mx-2 text-gold-soft">~</span>
            {formatKrw(range.max)}
          </p>
          <p className="mt-2 text-xs text-white/60">
            (약 {manwonFormatter.format(range.min)}원 ~ {manwonFormatter.format(range.max)}원)
          </p>

          <div className="mt-7 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs leading-6 text-white/80">
            <p>· 상담료(33,000~55,000원)는 수임 확정 시 전액 차감됩니다.</p>
            <p>· 정확한 금액은 무료 검토 후 확정됩니다.</p>
          </div>

          <Link
            href={intakeHref}
            className="ethos-cta-shine mt-7 inline-flex h-12 w-full items-center justify-center rounded-lg bg-gold px-6 text-sm font-bold text-primary shadow-md transition-all duration-300 hover:bg-gold-soft hover:shadow-lg"
          >
            이 조건으로 무료 검토 신청 →
          </Link>

          <p className="mt-5 text-[11px] leading-5 text-white/55">
            본 계산은 참고용 예상 범위이며 실제 견적과 다를 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
