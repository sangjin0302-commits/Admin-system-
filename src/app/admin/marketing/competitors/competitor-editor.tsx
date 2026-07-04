"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Competitor, CompetitorService } from "@/lib/services/competitor-tracker-service";

type Draft = {
  name: string;
  url: string;
  notes: string;
  services: CompetitorService[];
};

const EMPTY: Draft = { name: "", url: "", notes: "", services: [] };

export function CompetitorEditor({ initial }: { initial: Competitor[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Competitor[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);

  function startAdd() {
    setEditingId("new");
    setDraft(EMPTY);
  }
  function startEdit(c: Competitor) {
    setEditingId(c.id);
    setDraft({ name: c.name, url: c.url, notes: c.notes, services: [...c.services] });
  }
  function cancel() {
    setEditingId(null);
    setDraft(EMPTY);
  }

  async function save() {
    setBusy(true);
    try {
      if (editingId === "new") {
        const res = await fetch("/api/admin/marketing/competitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        const data = await res.json();
        if (data.ok) setItems((prev) => [...prev, data.entry]);
      } else if (editingId) {
        const res = await fetch(`/api/admin/marketing/competitors/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        const data = await res.json();
        if (data.ok)
          setItems((prev) => prev.map((c) => (c.id === editingId ? data.entry : c)));
      }
      cancel();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("이 경쟁사를 삭제할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/marketing/competitors/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) setItems((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function updateService(i: number, patch: Partial<CompetitorService>) {
    setDraft((d) => ({
      ...d,
      services: d.services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }
  function addService() {
    setDraft((d) => ({ ...d, services: [...d.services, { name: "", priceRange: "" }] }));
  }
  function removeService(i: number) {
    setDraft((d) => ({ ...d, services: d.services.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="ui-kicker">추적 중인 경쟁사 ({items.length})</p>
        <button
          type="button"
          onClick={startAdd}
          className="rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-white"
        >
          + 경쟁사 추가
        </button>
      </div>

      {editingId !== null && (
        <div className="rounded-xl border border-primary/50 bg-primary/5 p-4">
          <p className="ui-kicker mb-3">{editingId === "new" ? "새 경쟁사" : "편집"}</p>
          <div className="grid gap-2">
            <input
              className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
              placeholder="이름"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <input
              className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
              placeholder="URL"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
            <textarea
              className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
              placeholder="메모"
              rows={2}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
            <div className="rounded-md border border-line bg-surface p-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">서비스 & 가격</p>
                <button type="button" onClick={addService} className="text-xs text-primary">
                  + 서비스 추가
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {draft.services.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="flex-1 rounded-md border border-line bg-surface px-2 py-1 text-xs"
                      placeholder="서비스명"
                      value={s.name}
                      onChange={(e) => updateService(i, { name: e.target.value })}
                    />
                    <input
                      className="w-40 rounded-md border border-line bg-surface px-2 py-1 text-xs"
                      placeholder="가격 (예: 50만원)"
                      value={s.priceRange}
                      onChange={(e) => updateService(i, { priceRange: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      className="text-xs text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={cancel}
                className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs"
              >
                취소
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy || !draft.name.trim()}
                className="rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {busy ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/40 text-xs">
            <tr>
              <th className="px-3 py-2 text-left">이름</th>
              <th className="px-3 py-2 text-left">URL</th>
              <th className="px-3 py-2 text-left">서비스</th>
              <th className="px-3 py-2 text-left">업데이트</th>
              <th className="px-3 py-2 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-text-muted">
                  등록된 경쟁사가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-t border-line align-top">
                  <td className="px-3 py-2 font-medium text-text-strong">{c.name}</td>
                  <td className="px-3 py-2 text-xs">
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-primary underline">
                        링크
                      </a>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {c.services.length === 0 ? (
                      <span className="text-text-muted">-</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {c.services.map((s, i) => (
                          <li key={i}>
                            {s.name}
                            {s.priceRange ? ` · ${s.priceRange}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-text-muted">
                    {c.updatedAt.slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="mr-2 text-primary"
                    >
                      편집
                    </button>
                    <button type="button" onClick={() => remove(c.id)} className="text-red-600">
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
