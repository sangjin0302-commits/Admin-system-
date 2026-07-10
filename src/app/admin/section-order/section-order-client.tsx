"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";

type SectionDef = { id: string; label: string; description?: string };
type SaveState = "idle" | "saving" | "saved" | "error";

export function SectionOrderClient({
  page,
  initialOrder,
  schema
}: {
  page: string;
  initialOrder: string[];
  schema: SectionDef[];
}) {
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [initial] = useState<string[]>(initialOrder);
  const [state, setState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const schemaById = new Map(schema.map((s) => [s.id, s]));
  const isDirty = order.join(",") !== initial.join(",");

  const move = useCallback((idx: number, delta: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const reset = useCallback(() => setOrder(schema.map((s) => s.id)), [schema]);

  const save = useCallback(async () => {
    setState("saving");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/section-order/${encodeURIComponent(page)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data?.error ?? "저장 실패");
        setState("error");
        return;
      }
      setOrder(data.order as string[]);
      setState("saved");
      setTimeout(() => setState("idle"), 1800);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setState("error");
    }
  }, [page, order]);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-strong">순서 편집</h2>
        <div className="flex items-center gap-2">
          {state === "saved" && <span className="text-[11px] text-green-600">저장됨</span>}
          {state === "error" && <span className="text-[11px] text-red-600">{errorMsg}</span>}
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-xs text-text-strong hover:bg-line/20"
          >
            기본값
          </button>
          <button
            type="button"
            disabled={!isDirty || state === "saving"}
            onClick={save}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            {state === "saving" ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>

      <ol className="mt-4 space-y-2">
        {order.map((id, idx) => {
          const def = schemaById.get(id);
          if (!def) return null;
          return (
            <li
              key={id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-line/30 text-[11px] font-semibold text-text-strong">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-text-strong">{def.label}</p>
                  <p className="text-[11px] text-text-muted">
                    <code className="rounded bg-line/30 px-1">{def.id}</code>
                    {def.description && <span className="ml-2">· {def.description}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="위로 이동"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-md border border-line bg-white px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="아래로 이동"
                  onClick={() => move(idx, 1)}
                  disabled={idx === order.length - 1}
                  className="rounded-md border border-line bg-white px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
