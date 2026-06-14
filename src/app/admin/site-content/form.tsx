"use client";

import { useState } from "react";

type Field = {
  key: string;
  value: string;
  label: string;
  hint?: string;
  multiline: boolean;
};

export function SiteContentForm({ initialFields }: { initialFields: Field[] }) {
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function update(key: string, value: string) {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, value } : f)));
    setStatus("idle");
  }

  async function handleSave() {
    setStatus("saving");
    const body: Record<string, string> = {};
    for (const f of fields) body[f.key] = f.value;

    try {
      const res = await fetch("/api/admin/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.multiline ? "lg:col-span-2" : ""}>
            <label htmlFor={f.key} className="block text-sm font-semibold text-text-strong">
              {f.label}
            </label>
            {f.hint && <p className="mt-1 text-xs text-text-muted">{f.hint}</p>}
            {f.multiline ? (
              <textarea
                id={f.key}
                value={f.value}
                onChange={(e) => update(f.key, e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            ) : (
              <input
                id={f.key}
                value={f.value}
                onChange={(e) => update(f.key, e.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 border-t border-line pt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-white transition hover:bg-[#143d5d] disabled:opacity-50"
        >
          {status === "saving" ? "저장 중…" : "저장하기"}
        </button>
        {status === "saved" && <span className="text-sm font-semibold text-emerald-600">✓ 저장되었습니다</span>}
        {status === "error" && <span className="text-sm font-semibold text-rose-600">저장 실패 — 다시 시도해 주세요</span>}
      </div>
    </div>
  );
}
