"use client";

import { useState } from "react";

type Item = {
  id: string;
  category: string;
  service: string;
  amount: string;
  note: string;
};

const CATEGORIES = [
  { key: "VISA_STAY", label: "비자/체류" },
  { key: "ADMIN_APPEAL", label: "행정심판" },
  { key: "CONTRACT_INVESTIGATION", label: "계약서/사실조사" },
  { key: "LICENSE_PERMIT", label: "인허가" },
  { key: "ETC", label: "기타" }
];

const EMPTY = { category: "VISA_STAY", service: "", amount: "", note: "" };

export function FeesManager({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!form.service.trim() || !form.amount.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/fees", {
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

  async function remove(id: string) {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/fees/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function catLabel(key: string) {
    return CATEGORIES.find((c) => c.key === key)?.label ?? key;
  }

  const grouped = CATEGORIES.map((c) => ({
    ...c,
    rows: items.filter((i) => i.category === c.key)
  })).filter((g) => g.rows.length > 0);

  return (
    <div className="space-y-8">
      {/* 추가 폼 */}
      <div className="rounded-[16px] border border-line bg-surface-muted/40 p-5">
        <h3 className="text-sm font-semibold text-text-strong">비용 항목 추가</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
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
            <label className="text-xs font-semibold text-text-muted">항목</label>
            <input
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              placeholder="예: 체류 자격 변경"
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">금액</label>
            <input
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="예: 33만원 / 착수 50만+성공보수"
              className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">비고</label>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="선택"
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

      {/* 목록 (분야별 그룹) */}
      {grouped.length === 0 ? (
        <p className="text-sm text-text-muted">등록된 비용 항목이 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.key}>
              <h3 className="text-sm font-semibold text-gold-deep">{catLabel(g.key)}</h3>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-text-muted">
                    <th className="py-2 font-medium">항목</th>
                    <th className="py-2 font-medium">금액</th>
                    <th className="py-2 font-medium">비고</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.id} className="border-b border-line/60">
                      <td className="py-2.5 font-medium text-text-strong">{r.service}</td>
                      <td className="py-2.5 text-primary">{r.amount}</td>
                      <td className="py-2.5 text-text-muted">{r.note || "—"}</td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => remove(r.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
