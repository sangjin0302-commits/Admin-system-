"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 관리자 헤더 전역 검색바 — 엔터 시 통합 검색 페이지로 이동. */
export function AdminSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term.length < 2) return;
    router.push(`/admin/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-xs">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="사건·문의·사례 검색…"
        aria-label="통합 검색"
        className="h-10 w-full rounded-full border border-line-strong bg-surface pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
      />
    </form>
  );
}
