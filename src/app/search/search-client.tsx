"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";

type Item = {
  id: string;
  type: "service" | "blog" | "case";
  title: string;
  description: string;
  url: string;
  category?: string;
};

const TYPE_BADGE: Record<string, string> = {
  service: "bg-indigo-100 text-indigo-800",
  blog: "bg-amber-100 text-amber-800",
  case: "bg-emerald-100 text-emerald-800",
};

const TYPE_LABEL: Record<string, string> = {
  service: "업무분야",
  blog: "블로그",
  case: "성공사례",
};

export function SearchClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/search-index")
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "title", weight: 0.6 },
          { name: "description", weight: 0.3 },
          { name: "category", weight: 0.1 },
        ],
        threshold: 0.35,
        includeScore: true,
        ignoreLocation: true,
      }),
    [items]
  );

  const results = q.trim()
    ? fuse.search(q.trim()).slice(0, 30).map((r) => r.item)
    : items.slice(0, 12);

  return (
    <>
      <input
        type="search"
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="비자, 행정심판, 계약서 등 검색…"
        className="w-full rounded-lg border border-line bg-white px-4 py-3 text-base"
      />
      {loading && (
        <p className="mt-4 text-sm text-text-muted">검색 인덱스 불러오는 중…</p>
      )}
      {!loading && results.length === 0 && (
        <p className="mt-6 text-sm text-text-muted">
          검색 결과가 없습니다. 다른 검색어를 입력해 보세요.
        </p>
      )}
      <ul className="mt-4 divide-y divide-line">
        {results.map((it) => (
          <li key={it.id}>
            <Link
              href={it.url}
              className="flex items-start gap-3 px-2 py-4 hover:bg-surface-muted"
            >
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${TYPE_BADGE[it.type] ?? ""}`}
              >
                {TYPE_LABEL[it.type] ?? it.type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-strong">{it.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                  {it.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
