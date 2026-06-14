"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function PortalBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portal/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.ok) setUnread(d.unread ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/portal/notifications"
      aria-label={unread > 0 ? `알림 ${unread}건` : "알림"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-gold-soft/30 hover:text-primary"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
        <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 3h16l-2-3z" />
        <path d="M9 19a3 3 0 0 0 6 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
