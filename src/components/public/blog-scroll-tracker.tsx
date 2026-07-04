"use client";

import { useEffect, useRef } from "react";

const MILESTONES = [25, 50, 75, 100] as const;
type Milestone = (typeof MILESTONES)[number];

type Props = {
  slug: string;
};

export function BlogScrollTracker({ slug }: Props) {
  const fired = useRef<Set<Milestone>>(new Set());
  const startedAt = useRef<number>(Date.now());
  const maxDepth = useRef<number>(0);
  const dntRef = useRef<boolean>(false);

  useEffect(() => {
    // Respect Do-Not-Track
    const nav = typeof navigator !== "undefined" ? navigator : null;
    const dnt =
      nav?.doNotTrack === "1" ||
      (nav as unknown as { msDoNotTrack?: string })?.msDoNotTrack === "1" ||
      (typeof window !== "undefined" &&
        (window as unknown as { doNotTrack?: string }).doNotTrack === "1");
    dntRef.current = Boolean(dnt);
    if (dntRef.current) return;

    fired.current = new Set();
    startedAt.current = Date.now();
    maxDepth.current = 0;

    let lastRun = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function computeAndFire() {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      if (total <= 0) return;
      const pct = Math.round((h.scrollTop / total) * 100);
      if (pct > maxDepth.current) maxDepth.current = pct;
      for (const m of MILESTONES) {
        if (pct >= m && !fired.current.has(m)) {
          fired.current.add(m);
          void sendDepth(slug, m, Date.now() - startedAt.current);
        }
      }
    }

    function onScroll() {
      const now = Date.now();
      const elapsed = now - lastRun;
      if (elapsed >= 200) {
        lastRun = now;
        computeAndFire();
      } else if (timer === null) {
        timer = setTimeout(() => {
          lastRun = Date.now();
          timer = null;
          computeAndFire();
        }, 200 - elapsed);
      }
    }

    function onUnload() {
      if (dntRef.current) return;
      const payload = JSON.stringify({
        slug,
        depth: nearestMilestone(maxDepth.current),
        readTimeMs: Date.now() - startedAt.current,
        final: true,
      });
      try {
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/public/blog-scroll", blob);
        }
      } catch {
        // ignore
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);

    // Fire once on mount for initial position
    computeAndFire();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
      if (timer !== null) clearTimeout(timer);
    };
  }, [slug]);

  return null;
}

function nearestMilestone(pct: number): Milestone {
  if (pct >= 100) return 100;
  if (pct >= 75) return 75;
  if (pct >= 50) return 50;
  return 25;
}

async function sendDepth(slug: string, depth: Milestone, readTimeMs: number) {
  try {
    await fetch("/api/public/blog-scroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, depth, readTimeMs }),
      keepalive: true,
    });
  } catch {
    // best-effort
  }
}
