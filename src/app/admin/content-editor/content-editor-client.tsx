"use client";

import { useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";

type Item = {
  key: string;
  label: string;
  type: "text" | "html" | "url";
  hint?: string;
  default: string;
  value: string;
};

type Section = { section: string; items: Item[] };

type SaveState = "idle" | "saving" | "saved" | "error";

export function ContentEditorClient({ sections }: { sections: Section[] }) {
  const initialMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of sections) for (const it of s.items) m[it.key] = it.value;
    return m;
  }, [sections]);

  const [drafts, setDrafts] = useState<Record<string, string>>(initialMap);
  const [states, setStates] = useState<Record<string, SaveState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setState = (key: string, s: SaveState) =>
    setStates((prev) => ({ ...prev, [key]: s }));

  const save = useCallback(async (key: string) => {
    setState(key, "saving");
    setErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      const res = await fetch(`/api/admin/content/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: drafts[key] ?? "" })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrors((prev) => ({ ...prev, [key]: data?.error ?? "저장 실패" }));
        setState(key, "error");
        return;
      }
      setState(key, "saved");
      setTimeout(() => setState(key, "idle"), 1800);
    } catch (err) {
      setErrors((prev) => ({ ...prev, [key]: (err as Error).message }));
      setState(key, "error");
    }
  }, [drafts]);

  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <Card key={s.section} className="p-5">
          <h2 className="text-base font-semibold text-text-strong">{s.section}</h2>
          <p className="mt-1 text-xs text-text-muted">{s.items.length}개 항목</p>
          <div className="mt-4 space-y-4">
            {s.items.map((it) => {
              const state = states[it.key] ?? "idle";
              const err = errors[it.key];
              const val = drafts[it.key] ?? "";
              const isDirty = val !== it.value;
              const multiline = it.type === "text" && it.default.includes("\n");

              return (
                <div key={it.key} className="rounded-lg border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <label htmlFor={`c-${it.key}`} className="text-sm font-medium text-text-strong">
                        {it.label}
                      </label>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        <code className="rounded bg-line/30 px-1">{it.key}</code>
                        {it.hint && <span className="ml-2">· {it.hint}</span>}
                      </p>
                    </div>
                    <span className="text-[11px] text-text-muted">{it.type}</span>
                  </div>

                  {multiline ? (
                    <textarea
                      id={`c-${it.key}`}
                      className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                      rows={Math.max(2, val.split("\n").length)}
                      value={val}
                      onChange={(e) => setDrafts((p) => ({ ...p, [it.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      id={`c-${it.key}`}
                      type={it.type === "url" ? "url" : "text"}
                      className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
                      value={val}
                      onChange={(e) => setDrafts((p) => ({ ...p, [it.key]: e.target.value }))}
                    />
                  )}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-text-muted">
                      기본값: <span className="italic">{it.default.slice(0, 60)}{it.default.length > 60 ? "…" : ""}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      {state === "saved" && <span className="text-[11px] text-green-600">저장됨</span>}
                      {state === "error" && <span className="text-[11px] text-red-600">{err ?? "오류"}</span>}
                      <button
                        type="button"
                        disabled={state === "saving" || !isDirty}
                        onClick={() => save(it.key)}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                      >
                        {state === "saving" ? "저장 중…" : "저장"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
