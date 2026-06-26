"use client";

import { useEffect, useRef } from "react";
import autoAnimate from "@formkit/auto-animate";

/**
 * 자식 항목 추가/제거/순서변경 시 자동 transition.
 * 행정사 사이트의 블로그 필터/검색 결과/카테고리 토글에 적용.
 */
export function AutoAnimateList({
  children,
  className = "",
  as: As = "div",
  durationMs = 250
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "section";
  durationMs?: number;
}) {
  const ref = useRef<HTMLDivElement | HTMLUListElement | HTMLElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    autoAnimate(ref.current, { duration: durationMs, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
  }, [durationMs]);

  return <As ref={ref as React.Ref<HTMLDivElement & HTMLUListElement>} className={className}>{children}</As>;
}
