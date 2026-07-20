"use client";

import { useEffect, useRef, useState } from "react";

type Stat = {
  value: number;
  suffix?: string;
  label: string;
  description: string;
};

const DEFAULT_STATS: readonly Stat[] = [
  { value: 3, suffix: "년", label: "대사관 비자 실무", description: "주한 대사관 비자·출입국 실무" },
  { value: 3, suffix: "개 언어", label: "한·영·아랍어", description: "다국어 상담·서류 검토 가능" },
  { value: 5, suffix: "분야", label: "전문 영역", description: "비자·심판·계약·인허가·법인설립" },
  { value: 24, suffix: "h", label: "검토 회신", description: "영업일 기준 무료 검토 회신" }
];

/**
 * "500+ 처리 사건 | 비자·심판 분야" 형식 파싱.
 * 앞 숫자 → value, 뒤 비숫자 → suffix, "|"로 제목·설명 분리.
 */
function parseStat(raw: string, fallback: Stat): Stat {
  if (!raw?.trim()) return fallback;
  const [head, label, description] = raw.split("|").map((s) => s.trim());
  const m = head?.match(/^([\d,]+)\s*(.*)$/);
  if (!m) return { ...fallback, label: label || fallback.label, description: description || fallback.description };
  return {
    value: Number(m[1].replace(/,/g, "")) || 0,
    suffix: m[2] || "",
    label: label || fallback.label,
    description: description || fallback.description
  };
}

function useCountUp(target: number, durationMs: number, start: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, start]);

  return value;
}

function StatCard({ stat, visible }: { stat: Stat; visible: boolean }) {
  const value = useCountUp(stat.value, 1500, visible);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-gold/25 bg-surface/80 px-6 py-7 text-center shadow-panel transition-colors hover:border-gold/50 hover:bg-gold-soft/10">
      <div className="flex items-baseline justify-center font-serif text-primary">
        <span className="text-5xl font-bold sm:text-6xl">{value.toLocaleString()}</span>
        {stat.suffix && (
          <span className="ml-1 text-2xl font-bold text-gold-deep sm:text-3xl">
            {stat.suffix}
          </span>
        )}
      </div>
      <p className="mt-3 font-serif text-base font-bold text-text-strong">{stat.label}</p>
      <p className="mt-1.5 text-xs leading-5 text-text-muted">{stat.description}</p>
    </div>
  );
}

export function TrustStats({ overrides }: { overrides?: (string | undefined)[] }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const STATS = DEFAULT_STATS.map((s, i) => parseStat(overrides?.[i] ?? "", s));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref}>
      <div className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Trust in Numbers</p>
        <h2 className="mt-3 font-serif text-2xl font-bold text-primary sm:text-3xl">
          신뢰의 근거
        </h2>
        <p className="mt-2 text-xs text-text-muted">
          ※ 아래 수치는 대표 행정사의 경력 기준입니다. 결과는 사안마다 달라 보장하지 않습니다.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {STATS.map((s) => (
          <StatCard key={s.label} stat={s} visible={visible} />
        ))}
      </div>
    </section>
  );
}
