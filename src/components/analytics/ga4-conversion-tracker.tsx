"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackGA4Event, trackScrollDepth } from "@/lib/utils/ga4-events";

export function GA4ConversionTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const firedDepths = useRef(new Set<number>());

  useEffect(() => {
    if (!enabled) return;
    trackGA4Event("page_view", { page_path: pathname });
    firedDepths.current.clear();
  }, [pathname, enabled]);

  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

  return null;
}
