"use client";

/**
 * UX8: 재방문자 배지.
 * - /services/* 방문 시 localStorage에 마지막 본 서비스 기록
 * - 홈("/")에서 재방문자에게 "지난번 보신 서비스" 칩 표시 → 바로가기
 *
 * Feature flag: `returning_visitor_badge` (public) — /api/public/features
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LS_KEY = "public.last_service";

const SERVICE_LABELS: Record<string, string> = {
  immigration: "비자 / 외국인 체류",
  appeal: "행정심판",
  contract: "계약서 / 사실조사",
  license: "인허가",
};

export function ReturningVisitorBadge() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [last, setLast] = useState<{ slug: string; at: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/public/features")
      .then((r) => r.json())
      .then((d: { flags?: Record<string, boolean> } | Record<string, boolean>) => {
        const flags = (d as { flags?: Record<string, boolean> }).flags ?? (d as Record<string, boolean>);
        if (flags?.returning_visitor_badge) setEnabled(true);
      })
      .catch(() => {});
  }, []);

  // 서비스 페이지 방문 기록
  useEffect(() => {
    const m = pathname.match(/^\/services\/([a-z-]+)/);
    if (m && SERVICE_LABELS[m[1]]) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ slug: m[1], at: Date.now() }));
      } catch { /* ignore */ }
    }
  }, [pathname]);

  // 홈에서 읽기
  useEffect(() => {
    if (pathname !== "/") return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { slug: string; at: number };
      // 30일 이내 기록만
      if (Date.now() - parsed.at < 30 * 24 * 60 * 60 * 1000 && SERVICE_LABELS[parsed.slug]) {
        setLast(parsed);
      }
    } catch { /* ignore */ }
  }, [pathname]);

  if (!enabled || !last || dismissed || pathname !== "/") return null;

  return (
    <div className="fixed bottom-24 left-4 z-40 max-w-[260px] rounded-xl border border-gold/40 bg-surface/95 p-3 shadow-floating backdrop-blur sm:left-6">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-text-muted">다시 오셨네요 👋</p>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-text-muted hover:text-text"
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      <Link
        href={`/services/${last.slug}`}
        className="mt-1 block text-sm font-bold text-primary hover:underline"
      >
        {SERVICE_LABELS[last.slug]} 이어보기 →
      </Link>
    </div>
  );
}
