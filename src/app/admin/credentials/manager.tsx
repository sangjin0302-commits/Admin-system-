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
  const [err, setErr] = useState<string | null>(null);

  const NET_ERR = "네트워크 오류입니다. 잠시 후 다시 시도해 주세요.";

  async function add() {
    if (!form.year.trim() || !form.title.trim()) return;
    setBusy(true);
    setErr(null);
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
      } else {
        setErr("항목 추가에 실패했습니다.");
      }
    } catch {
      setErr(NET_ERR);
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(item: Item) {
    setErr(null);
    try {
      const res = await fetch(`/api/admin/credentials/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published })
      });
      if (res.ok) setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, published: !i.published } : i)));
      else setErr("게시 상태 변경에 실패했습니다.");
    } catch {
      setErr(NET_ERR);
    }
  }

  async function remove(id: string) {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    setErr(null);
    try {
      const res = await fetch(`/api/admin/credentials/${id}`, { method: "DELETE" });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
      else setErr("삭제에 실패했습니다.");
    } catch {
      setErr(NET_ERR);
    }
  }

  function typeLabel(key: string) {
    return TYPES.find((t) => t.key === key)?.label ?? key;
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const prev = items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    setErr(null);
    try {
      const results = await Promise.all(
        next.map((it, i) =>
          fetch(`/api/admin/credentials/${it.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: i })
          })
        )
      );
      if (results.some((r) => !r.ok)) {
        setItems(prev); // 순서 저장 실패 → UI 롤백 (서버와 불일치 방지)
        setErr("순서 저장에 실패했습니다. 원래 순서로 되돌립니다.");
      }
    } catch {
      setItems(prev);
      setErr(NET_ERR);
    }
  }

  const [resumeBusy, setResumeBusy] = useState(false);
  async function downloadResume() {
    setResumeBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/credentials/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resume-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setErr("PDF 생성에 실패했습니다.");
      }
    } catch {
      setErr(NET_ERR);
    } finally {
      setResumeBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {err && (
        <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {err}
        </div>
      )}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-text-strong">등록된 경력 ({items.length})</h3>
          <button
            type="button"
            onClick={downloadResume}
            disabled={resumeBusy}
            className="inline-flex h-9 items-center rounded-lg border border-primary bg-surface px-4 text-xs font-semibold text-primary transition hover:bg-gold-soft/30 disabled:opacity-50"
          >
            {resumeBusy ? "생성 중…" : "약력(이력서) PDF 다운로드"}
          </button>
        </div>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">
            아직 직접 추가한 경력이 없습니다. (기본 연혁이 About 페이지에 표시됩니다.)
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item, index) => (
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
