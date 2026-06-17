"use client";

import { useState } from "react";

type Item = {
  id: string;
  category: string;
  quote: string;
  author: string;
  context: string;
  published: boolean;
};

const CATEGORIES = [
  { key: "VISA_STAY", label: "비자/체류" },
  { key: "ADMIN_APPEAL", label: "행정심판" },
  { key: "CONTRACT_INVESTIGATION", label: "계약서/사실조사" },
  { key: "LICENSE_PERMIT", label: "인허가" },
  { key: "CORP_FORMATION", label: "법인 설립" }
];

const EMPTY = { category: "VISA_STAY", quote: "", author: "", context: "", published: true };

export function TestimonialsManager({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!form.quote.trim() || !form.author.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setItems((prev) => [data.item, ...prev]);
        setForm({ ...EMPTY });
      }
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(item: Item) {
    const res = await fetch(`/api/admin/testimonials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !item.published })
    });
    if (res.ok) setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, published: !i.published } : i)));
  }

  async function remove(id: string) {
    if (!confirm("이 후기를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    await Promise.all(
      next.map((it, i) =>
        fetch(`/api/admin/testimonials/${it.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: i })
        })
      )
    ).catch(() => {});
  }

  function catLabel(key: string) {
    return CATEGORIES.find((c) => c.key === key)?.label ?? key;
  }

  return (
    <div className="space-y-8">
      {/* 추가 폼 */}
      <div className="rounded-[16px] border border-line bg-surface-muted/40 p-5">
        <h3 className="text-sm font-semibold text-text-strong">새 후기 추가</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-text-muted">분야</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">작성자 (익명)</label>
            <input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="예: 박○○"
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-text-muted">사안 (맥락)</label>
            <input
              value={form.context}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
              placeholder="예: 영업정지 처분 행정심판"
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-text-muted">후기 내용</label>
            <textarea
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              rows={3}
              placeholder="의뢰인 후기 (동의받은 익명 내용)"
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={busy}
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d] disabled:opacity-50"
        >
          {busy ? "추가 중…" : "후기 추가"}
        </button>
      </div>

      {/* 목록 */}
      <div>
        <h3 className="text-sm font-semibold text-text-strong">등록된 후기 ({items.length})</h3>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">
            아직 직접 추가한 후기가 없습니다. (기본 샘플 후기는 직접 추가 전까지 홈페이지에 노출됩니다.)
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item, index) => (
              <li key={item.id} className="rounded-[14px] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gold-soft/60 px-2.5 py-0.5 text-[11px] font-bold text-gold-deep">
                        {catLabel(item.category)}
                      </span>
                      {!item.published && (
                        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-bold text-text-muted">
                          미게시
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-text">&ldquo;{item.quote}&rdquo;</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {item.author} · {item.context}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label="위로"
                        className="flex h-5 w-7 items-center justify-center rounded-t border border-line text-text-muted transition hover:bg-surface-muted disabled:opacity-30"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 15l6-6 6 6" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                        aria-label="아래로"
                        className="flex h-5 w-7 items-center justify-center rounded-b border border-t-0 border-line text-text-muted transition hover:bg-surface-muted disabled:opacity-30"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 9l6 6 6-6" /></svg>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePublish(item)}
                      className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-text-strong transition hover:bg-surface-muted"
                    >
                      {item.published ? "숨기기" : "게시"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="inline-flex h-9 items-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
