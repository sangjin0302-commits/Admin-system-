"use client";

import { useMemo, useState } from "react";
import type { LegalNewsItem } from "@/lib/services/legal-news-service";

interface Props {
  initial: LegalNewsItem[];
}

export function LegalNewsClient({ initial }: Props) {
  const [list, setList] = useState<LegalNewsItem[]>(initial);
  const [category, setCategory] = useState("");
  const [onlyMatched, setOnlyMatched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(list.map((n) => n.category))).filter(Boolean),
    [list]
  );

  const filtered = useMemo(() => {
    return list.filter((n) => {
      if (category && n.category !== category) return false;
      if (onlyMatched && n.matchedCaseIds.length === 0 && n.matchedInquiryIds.length === 0) return false;
      return true;
    });
  }, [list, category, onlyMatched]);

  async function runFetch() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/insights/legal-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch" }),
      });
      const j = await res.json();
      if (j.ok) {
        setMsg(`${j.new}건 신규 · ${j.matched}건 매칭`);
        const refresh = await fetch("/api/admin/insights/legal-news").then((r) => r.json());
        if (refresh.ok) setList(refresh.items);
      } else {
        setMsg(j.error ?? "실패");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-line px-3 text-sm"
        >
          <option value="">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMatched} onChange={(e) => setOnlyMatched(e.target.checked)} />
          매칭된 뉴스만
        </label>
        <button
          type="button"
          onClick={runFetch}
          disabled={busy}
          className="h-10 rounded-lg border border-line px-3 text-xs font-semibold"
        >
          지금 수집
        </button>
        {msg && <span className="text-xs text-text-muted">{msg}</span>}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((n) => {
          const hasMatch = n.matchedCaseIds.length > 0 || n.matchedInquiryIds.length > 0;
          return (
            <a
              key={n.id}
              href={n.link}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-line bg-surface p-4 transition hover:border-primary"
            >
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{n.source} · {new Date(n.publishedAt).toLocaleDateString("ko-KR")}</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{n.category}</span>
              </div>
              <p className="mt-2 font-semibold text-text-strong">{n.title}</p>
              <p className="mt-2 text-sm text-text-muted">{n.summary}</p>
              {n.keywords.length > 0 && (
                <p className="mt-2 text-xs text-text-muted">🔖 {n.keywords.join(", ")}</p>
              )}
              {hasMatch && (
                <p className="mt-2 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  관련 사건 {n.matchedCaseIds.length}건 · 문의 {n.matchedInquiryIds.length}건
                </p>
              )}
            </a>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-text-muted">
            수집된 뉴스가 없습니다. "지금 수집" 을 눌러 시작하세요.
          </p>
        )}
      </div>
    </div>
  );
}
