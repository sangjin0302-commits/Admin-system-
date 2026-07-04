"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";

/**
 * 성공 사례 자연어 검색.
 * 서버 API 로 후보를 받고, 클라이언트에서 Fuse.js 로 재정렬.
 * 결과 그리드는 3장까지 노출한다.
 */

type CaseMatch = {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  summary: string;
  outcome: string;
  duration: string;
  score: number;
};

const VISIBLE = 3;

export function CaseSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [matches, setMatches] = useState<CaseMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setMatches([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetch(`/api/public/case-search?q=${encodeURIComponent(debounced)}`, {
      signal: ctrl.signal
    })
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as {
          ok?: boolean;
          matches?: CaseMatch[];
          error?: string;
        };
        if (!r.ok || !data.ok) {
          setError(data.error ?? "검색 중 오류가 발생했습니다.");
          setMatches([]);
        } else {
          setMatches(data.matches ?? []);
        }
      })
      .catch((err: unknown) => {
        if ((err as { name?: string } | null)?.name === "AbortError") return;
        setError("네트워크 오류가 발생했습니다.");
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [debounced]);

  // Client-side fuzzy re-rank for typo tolerance
  const ranked = useMemo(() => {
    if (!debounced || matches.length === 0) return matches;
    const fuse = new Fuse(matches, {
      includeScore: true,
      threshold: 0.4,
      keys: [
        { name: "title", weight: 0.55 },
        { name: "summary", weight: 0.25 },
        { name: "outcome", weight: 0.1 },
        { name: "categoryLabel", weight: 0.1 }
      ]
    });
    const results = fuse.search(debounced);
    if (results.length === 0) return matches;
    return results.map((r) => r.item);
  }, [debounced, matches]);

  const visible = ranked.slice(0, VISIBLE);
  const hasMore = ranked.length > VISIBLE;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: 비자 거부, 학원 인허가, 계약 검토"
          aria-label="사례 검색"
          className="h-12 w-full rounded-full border border-gold/40 bg-surface pl-11 pr-4 text-sm text-text-strong shadow-sm focus:border-primary focus:outline-none"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gold-deep"
        >
          🔍
        </span>
        {loading && (
          <span
            aria-hidden
            className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-gold border-t-transparent"
          />
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {debounced && !loading && ranked.length === 0 && !error && (
        <p className="mt-4 text-center text-sm text-text-muted">
          검색 결과가 없습니다. 다른 키워드로 시도해 보세요.
        </p>
      )}

      {visible.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {visible.map((c) => (
            <li
              key={c.slug}
              className="flex flex-col rounded-2xl border border-gold/30 bg-surface p-4 shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-gold-deep">
                {c.categoryLabel}
              </p>
              <h3 className="mt-1 font-serif text-base font-bold text-primary">
                {c.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-text-muted">
                {c.summary}
              </p>
              <p className="mt-3 text-[11px] font-semibold text-text-strong">
                결과: {c.outcome}
              </p>
              <p className="text-[11px] text-text-muted">기간: {c.duration}</p>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <p className="mt-3 text-center text-xs text-text-muted">
          외 {ranked.length - VISIBLE}건의 사례가 더 있습니다.
        </p>
      )}
    </div>
  );
}

export default CaseSearch;
