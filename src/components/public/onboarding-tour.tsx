"use client";

/**
 * 첫 방문자용 3단계 온보딩 오버레이.
 * data-tour-id 속성으로 대상 요소를 찾아 하이라이트한 뒤 툴팁을 옆에 표시한다.
 * sessionStorage("ethos_onboarded") 로 세션당 한 번만 노출.
 */

import { useCallback, useEffect, useState } from "react";

type Step = {
  id: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    id: "cta-consult",
    title: "무료 검토 요청",
    body: "지금 사안을 남기면 영업일 24시간 안에 검토 회신을 드립니다."
  },
  {
    id: "nav-ai",
    title: "AI 사전 진단",
    body: "간단한 상황 입력만으로 예상 절차와 리스크를 미리 확인해 보세요."
  },
  {
    id: "nav-blog",
    title: "블로그 · 칼럼",
    body: "비자 · 행정심판 · 인허가 실무 인사이트를 모아 두었습니다."
  }
];

const STORAGE_KEY = "ethos_onboarded";

type TargetRect = { top: number; left: number; width: number; height: number } | null;

export function OnboardingTour() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<TargetRect>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    try {
      const seen = window.sessionStorage.getItem(STORAGE_KEY);
      if (seen) return;
    } catch {
      // ignore storage errors
    }
    // 첫 페인트 후 한 박자 뒤에 시작 (레이아웃 안정)
    const t = window.setTimeout(() => setActive(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  const measure = useCallback((id: string) => {
    if (typeof document === "undefined") return;
    const el = document.querySelector<HTMLElement>(`[data-tour-id="${id}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top + window.scrollY,
      left: r.left + window.scrollX,
      width: r.width,
      height: r.height
    });
    // 필요 시 화면 안으로 스크롤
    if (r.top < 0 || r.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const current = STEPS[step];
    if (!current) return;
    measure(current.id);
    const onResize = () => measure(current.id);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [active, step, measure]);

  const finish = useCallback(() => {
    setActive(false);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  if (!mounted || !active) return null;

  const current = STEPS[step];
  if (!current) return null;

  // 툴팁 위치 계산 — 하이라이트 아래(공간이 부족하면 위)
  const tooltipTop = rect
    ? rect.top + rect.height + 12
    : typeof window !== "undefined"
      ? window.scrollY + window.innerHeight / 2 - 80
      : 0;
  const tooltipLeft = rect
    ? Math.max(16, Math.min(rect.left, (typeof window !== "undefined" ? window.innerWidth : 800) - 320))
    : typeof window !== "undefined"
      ? window.innerWidth / 2 - 160
      : 0;

  return (
    <div
      aria-live="polite"
      role="dialog"
      aria-label="온보딩 안내"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        pointerEvents: "none"
      }}
    >
      {/* 배경 dim (하이라이트 부분은 뚫린 것처럼 box-shadow spread 로 표현) */}
      <div
        onClick={finish}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10, 20, 40, 0.55)",
          pointerEvents: "auto",
          animation: "ethosTourFadeIn 240ms ease-out"
        }}
      />
      {/* 하이라이트 링 */}
      {rect && (
        <div
          style={{
            position: "absolute",
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: 12,
            boxShadow:
              "0 0 0 4px rgba(212,175,55,0.9), 0 0 0 9999px rgba(10,20,40,0.55)",
            pointerEvents: "none",
            transition: "top 200ms, left 200ms, width 200ms, height 200ms",
            animation: "ethosTourPulse 1600ms ease-in-out infinite"
          }}
        />
      )}
      {/* 툴팁 카드 */}
      <div
        style={{
          position: "absolute",
          top: tooltipTop,
          left: tooltipLeft,
          width: 300,
          background: "white",
          color: "#0f172a",
          borderRadius: 14,
          padding: "16px 18px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          pointerEvents: "auto",
          animation: "ethosTourSlideIn 260ms ease-out"
        }}
      >
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === step ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === step ? "#1a3c5f" : "#cbd5e1",
                transition: "width 200ms"
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{current.title}</p>
        <p style={{ fontSize: 13, lineHeight: 1.55, margin: "6px 0 14px", color: "#475569" }}>
          {current.body}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={finish}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "#64748b",
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            건너뛰기
          </button>
          <button
            type="button"
            onClick={() => {
              if (step >= STEPS.length - 1) {
                finish();
              } else {
                setStep((s) => s + 1);
              }
            }}
            style={{
              background: "#1a3c5f",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {step >= STEPS.length - 1 ? "시작하기" : "다음"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes ethosTourFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ethosTourSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ethosTourPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(212,175,55,0.9), 0 0 0 9999px rgba(10,20,40,0.55); }
          50% { box-shadow: 0 0 0 6px rgba(212,175,55,0.55), 0 0 0 9999px rgba(10,20,40,0.55); }
        }
      `}</style>
    </div>
  );
}
