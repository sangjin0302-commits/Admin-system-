"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PUBLIC_CATEGORY_LABEL, toPublicCategory } from "@/lib/services/blog-categorizer";

type Post = { slug: string; title: string; excerpt: string; category: string; date: string };

export function BlogSearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted transition hover:border-gold/60 hover:text-primary"
        aria-label="블로그 검색"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        검색
        <kbd className="hidden rounded border border-gold/30 bg-canvas px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">⌘K</kbd>
      </button>
      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selIdx, setSelIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
    fetch("/api/public/blog-search")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.posts) setPosts(d.posts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults(posts.slice(0, 20));
      setSelIdx(0);
      return;
    }
    let cancelled = false;

    // server-side body 검색 (정확한 매칭) + 클라 Fuse fuzzy 병행
    const serverPromise = fetch(`/api/public/blog-search?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.posts ?? []) as Post[])
      .catch(() => [] as Post[]);

    const fusePromise = import("fuse.js").then(({ default: Fuse }) => {
      const fuse = new Fuse(posts, {
        keys: ["title", "excerpt", "category"],
        threshold: 0.4,
        ignoreLocation: true
      });
      return fuse.search(q).slice(0, 30).map((h) => h.item);
    });

    Promise.all([serverPromise, fusePromise]).then(([server, fuse]) => {
      if (cancelled) return;
      // dedup by slug, server 우선
      const seen = new Set<string>();
      const merged: Post[] = [];
      for (const p of [...server, ...fuse]) {
        if (!seen.has(p.slug)) {
          seen.add(p.slug);
          merged.push(p);
        }
      }
      setResults(merged.slice(0, 40));
      setSelIdx(0);
    });

    return () => {
      cancelled = true;
    };
  }, [q, posts]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[selIdx];
      if (hit) {
        router.push(`/blog/${hit.slug}`);
        onClose();
      }
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [selIdx]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 p-4 pt-20 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-gold/30 bg-surface shadow-floating"
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="비자, 행정심판, 계약, 인허가, 법인설립…"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          {!loading && results.length > 0 && (
            <span className="rounded bg-gold-soft/50 px-2 py-0.5 text-[10px] font-bold text-gold-deep">
              {results.length}건
            </span>
          )}
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-surface-muted" aria-label="닫기">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">불러오는 중…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">
              {q ? `"${q}" 검색 결과 없음` : "글이 없습니다"}
            </p>
          ) : (
            <ul ref={listRef} className="divide-y divide-line">
              {results.map((r, idx) => (
                <li key={r.slug} data-idx={idx}>
                  <Link
                    href={`/blog/${r.slug}`}
                    onClick={onClose}
                    onMouseEnter={() => setSelIdx(idx)}
                    className={`block px-4 py-3 transition ${idx === selIdx ? "bg-gold-soft/30" : "hover:bg-gold-soft/15"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-gold-soft/50 px-2 py-0.5 text-[10px] font-bold text-gold-deep">
                        {PUBLIC_CATEGORY_LABEL[toPublicCategory(r.category)]}
                      </span>
                      <span className="text-xs text-text-muted">{r.date}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-text-strong line-clamp-1">{r.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{r.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line px-4 py-2 text-[11px] text-text-muted">
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono">↑↓</kbd> 이동 ·{" "}
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono">Enter</kbd> 선택 ·{" "}
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono">Esc</kbd> 닫기
        </div>
      </div>
    </div>
  );
}
