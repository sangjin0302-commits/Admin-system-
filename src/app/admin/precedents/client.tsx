"use client";

import { useMemo, useState } from "react";
import type { Precedent } from "@/lib/services/precedent-database-service";

interface Props {
  initial: Precedent[];
}

export function PrecedentsAdminClient({ initial }: Props) {
  const [list, setList] = useState<Precedent[]>(initial);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Precedent | null>(null);
  const [form, setForm] = useState({
    caseNo: "", court: "", decisionDate: "", category: "", summary: "", keywords: "", url: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [mode, setMode] = useState<"keyword" | "meaning">("keyword");
  const [meaningResults, setMeaningResults] = useState<Array<{ precedent: Precedent; score: number }>>([]);
  const [vectorMsg, setVectorMsg] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(list.map((p) => p.category))).filter(Boolean),
    [list]
  );

  const filtered = useMemo(() => {
    if (mode === "meaning") {
      return meaningResults
        .map((r) => r.precedent)
        .filter((p) => !category || p.category === category);
    }
    const needle = q.trim().toLowerCase();
    return list.filter((p) => {
      if (category && p.category !== category) return false;
      if (!needle) return true;
      return (
        p.caseNo.toLowerCase().includes(needle) ||
        p.summary.toLowerCase().includes(needle) ||
        p.court.toLowerCase().includes(needle) ||
        p.keywords.some((k) => k.toLowerCase().includes(needle))
      );
    });
  }, [list, q, category, mode, meaningResults]);

  const scoreById = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of meaningResults) m.set(r.precedent.id, r.score);
    return m;
  }, [meaningResults]);

  async function runMeaningSearch() {
    if (!q.trim()) {
      setMeaningResults([]);
      setVectorMsg("");
      return;
    }
    setBusy(true);
    setVectorMsg("");
    try {
      const res = await fetch(`/api/admin/precedents/vector-search?q=${encodeURIComponent(q)}&topK=30`);
      const j = await res.json();
      if (j.ok) {
        setMeaningResults(j.results ?? []);
        if (j.degraded) setVectorMsg("의미 검색 비활성 — 키워드로 대체");
        else if (j.status?.mode === "not-built") setVectorMsg("인덱스 미빌드 — 첫 검색은 느릴 수 있습니다");
        else if (j.status?.mode === "none") setVectorMsg("VOYAGE_API_KEY 미설정 — Haiku 리랭킹 사용");
      }
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    const res = await fetch("/api/admin/precedents");
    const j = await res.json();
    if (j.ok) setList(j.precedents);
  }

  async function sync() {
    setBusy(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/admin/precedents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const j = await res.json();
      setSyncMsg(j.error ? `동기화 실패: ${j.error}` : `${j.added}건 추가됨`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/admin/precedents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          data: {
            ...form,
            keywords: form.keywords.split(",").map((s) => s.trim()).filter(Boolean),
            tags: [],
          },
        }),
      });
      setForm({ caseNo: "", court: "", decisionDate: "", category: "", summary: "", keywords: "", url: "" });
      setShowForm(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;
    setBusy(true);
    try {
      await fetch("/api/admin/precedents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (selected?.id === id) setSelected(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex overflow-hidden rounded-lg border border-line">
          <button
            type="button"
            onClick={() => setMode("keyword")}
            className={`h-10 px-3 text-xs font-semibold ${mode === "keyword" ? "bg-primary text-white" : "bg-white"}`}
          >
            키워드
          </button>
          <button
            type="button"
            onClick={() => setMode("meaning")}
            className={`h-10 px-3 text-xs font-semibold ${mode === "meaning" ? "bg-primary text-white" : "bg-white"}`}
          >
            의미
          </button>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && mode === "meaning") runMeaningSearch();
          }}
          placeholder={mode === "meaning" ? "의미로 검색 (Enter)" : "사건번호·요지·키워드 검색"}
          className="h-10 flex-1 min-w-[200px] rounded-lg border border-line px-3 text-sm"
        />
        {mode === "meaning" && (
          <button
            type="button"
            onClick={runMeaningSearch}
            disabled={busy}
            className="h-10 rounded-lg border border-line px-3 text-xs font-semibold"
          >
            의미 검색
          </button>
        )}
        {vectorMsg && <span className="text-xs text-text-muted">{vectorMsg}</span>}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-line px-3 text-sm"
        >
          <option value="">전체 분류</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-white"
        >
          새 판례 추가
        </button>
        <button
          type="button"
          onClick={sync}
          disabled={busy}
          className="h-10 rounded-lg border border-line px-4 text-sm font-semibold"
        >
          Lawbot 동기화
        </button>
        {syncMsg && <span className="text-xs text-text-muted">{syncMsg}</span>}
      </div>

      {showForm && (
        <form onSubmit={submitAdd} className="grid grid-cols-1 gap-3 rounded-lg border border-line p-4 md:grid-cols-2">
          <input required placeholder="사건번호 (예: 2023구합12345)" value={form.caseNo}
            onChange={(e) => setForm({ ...form, caseNo: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
          <input required placeholder="법원/재결청" value={form.court}
            onChange={(e) => setForm({ ...form, court: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
          <input required type="date" value={form.decisionDate}
            onChange={(e) => setForm({ ...form, decisionDate: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
          <input required placeholder="분류 (예: 출입국)" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
          <input placeholder="키워드 (콤마 구분)" value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm md:col-span-2" />
          <input placeholder="URL (선택)" value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm md:col-span-2" />
          <textarea required placeholder="요지" value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className="min-h-[80px] rounded border border-line p-3 text-sm md:col-span-2" />
          <button type="submit" disabled={busy}
            className="rounded bg-primary px-4 py-2 text-sm font-bold text-white md:col-span-2">
            추가
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p)}
            className="rounded-lg border border-line bg-surface p-4 text-left transition hover:border-primary"
          >
            <p className="text-xs text-text-muted">
              {p.court} · {p.decisionDate}
              {mode === "meaning" && scoreById.has(p.id) && (
                <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                  유사도 {(scoreById.get(p.id)! * 100).toFixed(0)}%
                </span>
              )}
            </p>
            <p className="mt-1 font-mono text-sm font-semibold">{p.caseNo}</p>
            <p className="mt-2 text-xs text-primary">{p.category}</p>
            <p className="mt-2 line-clamp-3 text-sm">{p.summary}</p>
            {p.keywords.length > 0 && (
              <p className="mt-2 text-xs text-text-muted">🔖 {p.keywords.slice(0, 3).join(", ")}</p>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-text-muted">판례가 없습니다.</p>
        )}
      </div>

      {selected && (
        <div className="rounded-lg border-2 border-primary bg-surface-muted p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-text-muted">{selected.court} · {selected.decisionDate} · {selected.category}</p>
              <p className="mt-1 font-mono text-base font-bold">{selected.caseNo}</p>
            </div>
            <div className="flex gap-2">
              {selected.url && (
                <a href={selected.url} target="_blank" rel="noreferrer"
                  className="text-xs text-primary underline">원문</a>
              )}
              <button type="button" onClick={() => del(selected.id)}
                className="text-xs text-red-600">삭제</button>
              <button type="button" onClick={() => setSelected(null)}
                className="text-xs">닫기</button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm">{selected.summary}</p>
          {selected.fullText && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-primary">전문 보기</summary>
              <p className="mt-2 whitespace-pre-wrap text-xs">{selected.fullText}</p>
            </details>
          )}
          {selected.keywords.length > 0 && (
            <p className="mt-3 text-xs text-text-muted">키워드: {selected.keywords.join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
