"use client";

import { useState, useMemo } from "react";

type SortDirection = "asc" | "desc";

type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  getValue?: (item: T) => string | number | Date | null | undefined;
  render: (item: T) => React.ReactNode;
  className?: string;
};

type SortableTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  getKey: (item: T) => string;
  pageSize?: number;
  emptyMessage?: string;
};

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <svg viewBox="0 0 16 16" className={`ml-1 inline-block h-3 w-3 ${active ? "text-primary" : "text-text-muted/40"}`}>
      <path
        d="M8 3l4 5H4z"
        fill={active && direction === "asc" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M8 13l4-5H4z"
        fill={active && direction === "desc" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

export function SortableTable<T>({
  data,
  columns,
  getKey,
  pageSize = 15,
  emptyMessage = "데이터가 없습니다.",
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.getValue) return data;
    const getValue = col.getValue;
    return [...data].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">{emptyMessage}</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold ${col.sortable ? "cursor-pointer select-none hover:text-text-strong" : ""} ${col.className ?? ""}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && <SortIcon active={sortKey === col.key} direction={sortKey === col.key ? sortDir : "asc"} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {paged.map((item) => (
              <tr key={getKey(item)} className="align-top transition-colors hover:bg-surface-muted/50">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <p className="text-xs text-text-muted">
            {sorted.length}건 중 {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={safePage === 0}
              className="rounded-md px-2 py-1 text-xs font-medium text-text-muted transition hover:bg-surface-muted disabled:opacity-30"
            >
              «
            </button>
            <button
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 0}
              className="rounded-md px-2 py-1 text-xs font-medium text-text-muted transition hover:bg-surface-muted disabled:opacity-30"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => i === 0 || i === totalPages - 1 || Math.abs(i - safePage) <= 2)
              .reduce<(number | "...")[]>((acc, i, idx, arr) => {
                if (idx > 0 && i - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(i);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-text-muted">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`h-7 min-w-7 rounded-md px-2 text-xs font-medium transition ${
                      safePage === item
                        ? "bg-primary text-white"
                        : "text-text-muted hover:bg-surface-muted"
                    }`}
                  >
                    {(item as number) + 1}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages - 1}
              className="rounded-md px-2 py-1 text-xs font-medium text-text-muted transition hover:bg-surface-muted disabled:opacity-30"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={safePage >= totalPages - 1}
              className="rounded-md px-2 py-1 text-xs font-medium text-text-muted transition hover:bg-surface-muted disabled:opacity-30"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
