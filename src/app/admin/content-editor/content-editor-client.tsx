"use client";

import { useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { scanContent, type GuidelineViolation } from "@/lib/services/marketing-guideline-rules";

type ItemType = "text" | "html" | "url" | "image";

type Item = {
  key: string;
  label: string;
  type: ItemType;
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

  const uploadImage = useCallback(async (key: string, file: File) => {
    setState(key, "saving");
    setErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      const fd = new FormData();
      fd.append("key", key);
      fd.append("file", file);
      const res = await fetch(`/api/admin/content/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrors((prev) => ({ ...prev, [key]: data?.error ?? "업로드 실패" }));
        setState(key, "error");
        return;
      }
      setDrafts((prev) => ({ ...prev, [key]: data.url as string }));
      setState(key, "saved");
      setTimeout(() => setState(key, "idle"), 1800);
    } catch (err) {
      setErrors((prev) => ({ ...prev, [key]: (err as Error).message }));
      setState(key, "error");
    }
  }, []);

  const openPreview = useCallback(() => {
    try {
      const overrides: Record<string, string> = {};
      for (const s of sections) {
        for (const it of s.items) {
          const v = drafts[it.key] ?? "";
          if (v !== it.default) overrides[it.key] = v;
        }
      }
      const b64 =
        typeof window !== "undefined"
          ? window.btoa(unescape(encodeURIComponent(JSON.stringify(overrides))))
          : "";
      const url = `/admin/content-editor/preview?overrides=${encodeURIComponent(b64)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("preview open failed", err);
    }
  }, [drafts, sections]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openPreview}
          className="rounded-md border border-primary bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        >
          미리보기
        </button>
      </div>
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
              const isImage = it.type === "image";
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

                  {isImage ? (
                    <div className="mt-2 space-y-2">
                      {val ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={val}
                          alt={it.label}
                          className="max-h-40 rounded-md border border-line bg-white object-contain"
                        />
                      ) : (
                        <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-line text-[11px] text-text-muted">
                          이미지 없음
                        </div>
                      )}
                      <input
                        id={`c-${it.key}`}
                        type="file"
                        accept="image/*"
                        className="block w-full text-xs"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadImage(it.key, f);
                          e.target.value = "";
                        }}
                      />
                      {val && (
                        <input
                          type="url"
                          className="w-full rounded-md border border-line bg-white px-3 py-1.5 text-xs"
                          value={val}
                          onChange={(e) => setDrafts((p) => ({ ...p, [it.key]: e.target.value }))}
                          placeholder="이미지 URL"
                        />
                      )}
                    </div>
                  ) : multiline ? (
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

                  {!isImage && <GuidelineInline text={val} />}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-text-muted">
                      {isImage
                        ? "이미지 파일을 선택하면 자동으로 업로드/저장됩니다 (최대 5MB)"
                        : (
                          <>
                            기본값: <span className="italic">{it.default.slice(0, 60)}{it.default.length > 60 ? "…" : ""}</span>
                          </>
                        )}
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
                        {state === "saving" ? (isImage ? "업로드 중…" : "저장 중…") : "저장"}
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

function GuidelineInline({ text }: { text: string }) {
  const violations: GuidelineViolation[] = useMemo(() => scanContent(text), [text]);
  if (violations.length === 0) return null;
  return (
    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/60 p-2">
      <p className="text-[11px] font-semibold text-amber-800">지침 위반 {violations.length}건 감지</p>
      <ul className="mt-1 space-y-0.5">
        {violations.map((v, idx) => (
          <li key={`${v.position}-${idx}`} className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span
              className={`rounded px-1 py-[1px] text-[10px] font-semibold ${
                v.severity === "error" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {v.severity}
            </span>
            <code className="rounded bg-white/70 px-1">{v.phrase}</code>
            <span className="text-text-muted">— {v.reason}</span>
            {v.suggestion && (
              <span className="text-text-muted">
                → <span className="text-green-700">{v.suggestion}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
