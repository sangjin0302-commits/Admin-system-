"use client";

import { useEffect, useState } from "react";

type CaseOption = { id: string; label: string };

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
  { key: "CORP_FORMATION", label: "법인 설립" },
  { key: "ETC", label: "기타" }
];

const EMPTY = { category: "VISA_STAY", service: "", amount: "", note: "" };

export function FeesManager({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  // 견적서 생성용 상태
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quoteClient, setQuoteClient] = useState("");
  const [quoteTotal, setQuoteTotal] = useState("");
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteCaseId, setQuoteCaseId] = useState("");
  const [cases, setCases] = useState<CaseOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/case-matters/options")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) setCases(d.items ?? []);
      })
      .catch(() => {});
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function downloadQuote() {
    if (selected.size === 0) return;
    setQuoteBusy(true);
    try {
      const res = await fetch("/api/admin/fees/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: quoteClient,
          feeItemIds: Array.from(selected),
          totalText: quoteTotal,
          caseId: quoteCaseId || undefined
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quote-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert((await res.text()) || "견적서 생성 실패");
      }
    } finally {
      setQuoteBusy(false);
    }
  }

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
                    <th className="w-8 py-2" />
                    <th className="py-2 font-medium">항목</th>
                    <th className="py-2 font-medium">금액</th>
                    <th className="py-2 font-medium">비고</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.id} className="border-b border-line/60">
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          aria-label="견적서 포함"
                          className="h-4 w-4 accent-[#1a3c5f]"
                        />
                      </td>
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

      {/* 견적서 생성 */}
      {items.length > 0 && (
        <div className="rounded-[16px] border border-primary/20 bg-primary/5 p-5">
          <h3 className="text-sm font-bold text-primary">견적서 PDF 생성</h3>
          <p className="mt-1 text-xs text-text-muted">
            위 표에서 체크한 항목({selected.size}개)으로 견적서를 만듭니다. 공개되지 않으며, 의뢰인 안내용으로만 사용하세요.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              value={quoteClient}
              onChange={(e) => setQuoteClient(e.target.value)}
              placeholder="의뢰인명 (선택)"
              className="h-10 w-48 rounded-lg border border-line bg-surface px-3 text-sm"
            />
            <input
              value={quoteTotal}
              onChange={(e) => setQuoteTotal(e.target.value)}
              placeholder="합계 표기 (예: 부가세 별도)"
              className="h-10 w-56 rounded-lg border border-line bg-surface px-3 text-sm"
            />
            <select
              value={quoteCaseId}
              onChange={(e) => setQuoteCaseId(e.target.value)}
              className="h-10 min-w-[14rem] rounded-lg border border-line bg-surface px-3 text-sm"
            >
              <option value="">사건 연결 안 함</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={downloadQuote}
              disabled={selected.size === 0 || quoteBusy}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d] disabled:opacity-50"
            >
              {quoteBusy ? "생성 중…" : "견적서 PDF 다운로드"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
