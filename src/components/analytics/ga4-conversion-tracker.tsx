"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackGA4Event, trackScrollDepth } from "@/lib/utils/ga4-events";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flag";

export function GA4ConversionTracker({ enabled = true }: { enabled?: boolean }) {
  const pathname = usePathname();
  const firedDepths = useRef(new Set<number>());
  // ga4_conversion_tracking 플래그를 실제로 존중 (하드코딩 우회 제거).
  const flagOn = useFeatureFlag("ga4_conversion_tracking") !== false;
  const active = enabled && flagOn;

  useEffect(() => {
    if (!active) return;
    trackGA4Event("page_view", { page_path: pathname });
    firedDepths.current.clear();
  }, [pathname, active]);

  useEffect(() => {
    if (!active) return;
    const thresholds = [25, 50, 75, 100];
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);
      for (const t of thresholds) {
        if (pct >= t && !firedDepths.current.has(t)) {
          firedDepths.current.add(t);
          trackScrollDepth(t);
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [active]);

  return null;
}
