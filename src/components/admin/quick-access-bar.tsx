"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Shortcut = {
  target: string;
  count: number;
  label: string;
};

/**
 * 관리자 대시보드 상단 고정 바 — 현재 관리자의 최근 자주 쓰는 페이지 5개 노출.
 * adaptive_ui 플래그가 꺼져있으면 서버가 빈 응답을 줄 수 있음 → 그때는 렌더하지 않음.
 */
export function QuickAccessBar({ userId }: { userId?: string | null }) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const url = userId
      ? `/api/admin/adaptive-ui?userId=${encodeURIComponent(userId)}`
      : "/api/admin/adaptive-ui";
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data?.ok && Array.isArray(data.shortcuts)) {
          setShortcuts(data.shortcuts.slice(0, 5));
        }
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  if (!loaded || shortcuts.length === 0) return null;

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 bg-white/95 backdrop-blur border-b px-4 py-2 text-xs">
      <span className="text-gray-500">자주 쓰는 페이지:</span>
      {shortcuts.map((s) => (
        <Link
          key={s.target}
          href={s.target}
          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          {s.label} <span className="text-gray-400">({s.count})</span>
        </Link>
      ))}
    </div>
  );
}
