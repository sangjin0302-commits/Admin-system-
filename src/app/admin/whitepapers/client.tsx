"use client";

import Link from "next/link";
import { useState } from "react";
import type { Purchase, Whitepaper, WhitepaperCategory } from "@/lib/services/whitepaper-service";

export function WhitepapersAdminClient({
  initialItems,
  initialPurchases,
}: {
  initialItems: Whitepaper[];
  initialPurchases: Purchase[];
}) {
  const [items, setItems] = useState<Whitepaper[]>(initialItems);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", price: 29000,
    category: "practice_guide" as WhitepaperCategory,
    pdfUrl: "", tocPreview: "", coverImage: "", sampleUrl: "",
  });

  const totalRevenue = purchases.reduce((s, p) => s + p.amountKrw, 0);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/whitepapers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert",
          whitepaper: {
            title: form.title, description: form.description,
            price: Number(form.price), category: form.category,
            pdfUrl: form.pdfUrl,
            tocPreview: form.tocPreview.split("\n").filter(Boolean),
            coverImage: form.coverImage || undefined,
            sampleUrl: form.sampleUrl || undefined,
            published: false,
          },
        }),
      });
      const json = (await res.json()) as { ok: boolean; items?: Whitepaper[] };
      if (json.ok && json.items) {
        setItems(json.items);
        setForm({ title: "", description: "", price: 29000, category: "practice_guide", pdfUrl: "", tocPreview: "", coverImage: "", sampleUrl: "" });
      }
    } finally { setBusy(false); }
  }

  async function togglePublish(id: string, published: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/whitepapers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", id, published }),
      });
      const json = (await res.json()) as { ok: boolean; items?: Whitepaper[] };
      if (json.ok && json.items) setItems(json.items);
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/whitepapers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const json = (await res.json()) as { ok: boolean; items?: Whitepaper[]; purchases?: Purchase[] };
      if (json.ok) {
        if (json.items) setItems(json.items);
        if (json.purchases) setPurchases(json.purchases);
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-text-muted">전체 백서</p><p className="text-2xl font-bold text-primary">{items.length}</p></div>
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-text-muted">판매 건</p><p className="text-2xl font-bold text-primary">{purchases.length}</p></div>
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-text-muted">누적 매출</p><p className="text-2xl font-bold text-primary">₩{totalRevenue.toLocaleString()}</p></div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="font-serif text-lg font-bold text-primary">신규 백서</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input placeholder="제목" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded border border-line px-3 py-2 text-sm md:col-span-2" />
          <textarea placeholder="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded border border-line px-3 py-2 text-sm md:col-span-2" rows={3} />
          <input type="number" placeholder="가격 (KRW)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="rounded border border-line px-3 py-2 text-sm" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as WhitepaperCategory })} className="rounded border border-line px-3 py-2 text-sm">
            <option value="practice_guide">실무 가이드</option>
            <option value="case_analysis">판례 분석</option>
            <option value="procedure_guide">절차 가이드</option>
          </select>
          <input placeholder="PDF URL" value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} className="rounded border border-line px-3 py-2 text-sm md:col-span-2" />
          <input placeholder="샘플 PDF URL" value={form.sampleUrl} onChange={(e) => setForm({ ...form, sampleUrl: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <input placeholder="커버 이미지 URL" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <textarea placeholder="목차 (한 줄에 하나)" value={form.tocPreview} onChange={(e) => setForm({ ...form, tocPreview: e.target.value })} className="rounded border border-line px-3 py-2 text-sm md:col-span-2" rows={3} />
        </div>
        <button type="button" disabled={busy || !form.title} onClick={save} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">저장 (비공개)</button>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="font-serif text-lg font-bold text-primary">백서 목록</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-line text-left"><th className="p-2">제목</th><th className="p-2">분류</th><th className="p-2">가격</th><th className="p-2">공개</th><th className="p-2"></th></tr></thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id} className="border-b border-line/50">
                  <td className="p-2"><Link href={`/whitepapers/${w.id}`} className="text-primary underline">{w.title}</Link></td>
                  <td className="p-2">{w.category}</td>
                  <td className="p-2">₩{w.price.toLocaleString()}</td>
                  <td className="p-2">
                    <button type="button" disabled={busy} onClick={() => togglePublish(w.id, !w.published)} className={`rounded px-2 py-1 text-xs ${w.published ? "bg-primary text-white" : "border border-line"}`}>
                      {w.published ? "공개" : "비공개"}
                    </button>
                  </td>
                  <td className="p-2 text-right"><button type="button" disabled={busy} onClick={() => remove(w.id)} className="text-xs text-red-500 underline">삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="font-serif text-lg font-bold text-primary">최근 판매</h2>
        {purchases.length === 0 ? <p className="mt-2 text-sm text-text-muted">없음</p> : (
          <table className="mt-3 w-full text-sm">
            <thead><tr className="border-b border-line text-left"><th className="p-2">일시</th><th className="p-2">구매자</th><th className="p-2">백서</th><th className="p-2">금액</th></tr></thead>
            <tbody>
              {purchases.slice(0, 20).map((p) => (
                <tr key={p.id} className="border-b border-line/50">
                  <td className="p-2">{new Date(p.paidAt).toLocaleString("ko-KR")}</td>
                  <td className="p-2">{p.buyerEmail}</td>
                  <td className="p-2">{items.find((i) => i.id === p.whitepaperId)?.title ?? p.whitepaperId}</td>
                  <td className="p-2">₩{p.amountKrw.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
