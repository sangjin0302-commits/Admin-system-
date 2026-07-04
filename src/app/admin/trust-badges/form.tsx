"use client";

import { useState } from "react";

import type { TrustBadge } from "@/components/public/trust-belt";

type Row = TrustBadge & { _key: number };

let _rowCounter = 0;
function newRow(seed: Partial<TrustBadge> = {}): Row {
  _rowCounter += 1;
  return { label: "", iconUrl: "", url: "", ...seed, _key: _rowCounter };
}

export function TrustBadgesForm({ initial }: { initial: TrustBadge[] }) {
  const [rows, setRows] = useState<Row[]>(
    initial.length > 0 ? initial.map((b) => newRow(b)) : [newRow()],
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function update(idx: number, patch: Partial<TrustBadge>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setStatus("idle");
  }
  function add() {
    setRows((prev) => [...prev, newRow()]);
    setStatus("idle");
  }
  function remove(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
    setStatus("idle");
  }
  function move(idx: number, dir: -1 | 1) {
    setRows((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    const badges: TrustBadge[] = rows
      .map((r) => ({
        label: r.label.trim(),
        iconUrl: r.iconUrl?.trim() || undefined,
        url: r.url?.trim() || undefined,
      }))
      .filter((b) => b.label.length > 0);

    try {
      const res = await fetch("/api/admin/trust-badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badges }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {rows.map((row, idx) => (
          <li
            key={row._key}
            className="grid gap-3 rounded-lg border border-line bg-surface p-3 lg:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <label className="block">
              <span className="text-xs font-semibold text-text-strong">라벨</span>
              <input
                value={row.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                placeholder="예: 한국행정사협회"
                className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-strong">아이콘 URL (선택)</span>
              <input
                value={row.iconUrl ?? ""}
                onChange={(e) => update(idx, { iconUrl: e.target.value })}
                placeholder="/uploads/badges/xxx.png"
                className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-text-strong">링크 URL (선택)</span>
              <input
                value={row.url ?? ""}
                onChange={(e) => update(idx, { url: e.target.value })}
                placeholder="https://…"
                className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="h-10 rounded-md border border-line bg-surface px-2 text-xs disabled:opacity-40"
                aria-label="위로"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === rows.length - 1}
                className="h-10 rounded-md border border-line bg-surface px-2 text-xs disabled:opacity-40"
                aria-label="아래로"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="h-10 rounded-md border border-rose-300 bg-rose-50 px-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={add}
          className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-muted"
        >
          + 뱃지 추가
        </button>
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-[#143d5d] disabled:opacity-50"
        >
          {status === "saving" ? "저장 중…" : "저장하기"}
        </button>
        {status === "saved" && <span className="text-sm font-semibold text-emerald-600">✓ 저장되었습니다</span>}
        {status === "error" && <span className="text-sm font-semibold text-rose-600">저장 실패</span>}
      </div>
    </div>
  );
}
