"use client";

import { useState } from "react";

type Item = {
  id: string;
  type: string;
  year: string;
  title: string;
  detail: string;
  published: boolean;
};

const TYPES = [
  { key: "CAREER", label: "경력" },
  { key: "LICENSE", label: "자격" },
  { key: "EDUCATION", label: "학력" },
  { key: "AWARD", label: "수상" },
  { key: "ACTIVITY", label: "활동" }
];

const EMPTY = { type: "CAREER", year: "", title: "", detail: "", published: true };

export function CredentialsManager({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!form.year.trim() || !form.title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.item) {
        setItems((prev) => [...prev, data.item]);
        setForm({ ...EMPTY });
      }
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(item: Item) {
    const res = await fetch(`/api/admin/credentials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !item.published })
    });
    if (res.ok) setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, published: !i.published } : i)));
  }

  async function remove(id: string) {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/credentials/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function typeLabel(key: string) {
    return TYPES.find((t) => t.key === key)?.label ?? key;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[16px] border border-line bg-surface-muted/40 p-5">
        <h3 className="text-sm font-semibold text-text-strong">경력 항목 추가</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <div>
            <label className="text-xs font-semibold text-text-muted">구분</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">연도</label>
            <input
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="예: 2020"
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-text-muted">제목</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예: 행정사 자격 취득"
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            />
          </div>
          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-text-muted">상세 (선택)</label>
            <input
              value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
              placeholder="예: 제○○호 / 발급기관"
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={busy}
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d] disabled:opacity-50"
        >
          {busy ? "추가 중…" : "항목 추가"}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-strong">등록된 경력 ({items.length})</h3>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">
            아직 직접 추가한 경력이 없습니다. (기본 연혁이 About 페이지에 표시됩니다.)
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-[14px] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gold-soft/60 px-2.5 py-0.5 text-[11px] font-bold text-gold-deep">
                        {typeLabel(item.type)}
                      </span>
                      <span className="font-serif text-sm font-bold text-primary">{item.year}</span>
                      {!item.published && (
                        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-bold text-text-muted">
                          미게시
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-medium text-text-strong">{item.title}</p>
                    {item.detail && <p className="mt-1 text-xs text-text-muted">{item.detail}</p>}
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
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
