"use client";

import { useEffect, useMemo, useState } from "react";
import { LANGS, type Lang } from "@/lib/i18n/locales";

type Catalogue = Record<string, Record<Lang, Record<string, string>>>;
type Overrides = Partial<Record<Lang, Record<string, Record<string, string>>>>;

interface ApiPayload {
  ok: boolean;
  catalogue: Catalogue;
  overrides: Overrides;
}

export function I18nEditor() {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [activeNs, setActiveNs] = useState<string>("");
  const [saving, setSaving] = useState<string>(""); // key currently being saved
  const [drafts, setDrafts] = useState<Record<string, Partial<Record<Lang, string>>>>({});
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/i18n")
      .then((r) => r.json())
      .then((json: ApiPayload) => {
        if (!alive) return;
        setPayload(json);
        const first = Object.keys(json.catalogue)[0] ?? "";
        setActiveNs(first);
      })
      .catch(() => alive && setError("불러오기 실패"));
    return () => {
      alive = false;
    };
  }, []);

  const namespaces = useMemo(
    () => (payload ? Object.keys(payload.catalogue) : []),
    [payload]
  );

  const rows = useMemo(() => {
    if (!payload || !activeNs) return [] as Array<{ key: string; values: Record<Lang, string> }>;
    const bundle = payload.catalogue[activeNs];
    const keys = new Set<string>();
    for (const l of LANGS) for (const k of Object.keys(bundle[l] ?? {})) keys.add(k);
    return Array.from(keys)
      .sort()
      .map((key) => ({
        key,
        values: {
          ko: bundle.ko?.[key] ?? "",
          en: bundle.en?.[key] ?? "",
          zh: bundle.zh?.[key] ?? "",
        },
      }));
  }, [payload, activeNs]);

  function overrideOf(key: string, lang: Lang): string {
    return payload?.overrides?.[lang]?.[activeNs]?.[key] ?? "";
  }

  function draftValue(key: string, lang: Lang): string {
    const draft = drafts[key]?.[lang];
    if (draft !== undefined) return draft;
    return overrideOf(key, lang);
  }

  function setDraft(key: string, lang: Lang, value: string) {
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [lang]: value } }));
  }

  async function save(key: string) {
    if (!payload) return;
    setSaving(key);
    setError("");
    try {
      const res = await fetch("/api/admin/i18n", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: activeNs,
          key,
          values: drafts[key] ?? {},
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const json = (await res.json()) as { ok: boolean; overrides: Overrides };
      setPayload({ ...payload, overrides: json.overrides });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch {
      setError("저장 실패");
    } finally {
      setSaving("");
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!payload) return <p className="text-sm text-text-muted">불러오는 중...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {namespaces.map((ns) => (
          <button
            key={ns}
            type="button"
            onClick={() => setActiveNs(ns)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
              activeNs === ns
                ? "border-primary bg-primary text-white"
                : "border-line bg-surface text-text-muted hover:border-primary"
            }`}
          >
            {ns}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface-muted text-left">
            <tr>
              <th className="px-3 py-2 font-semibold">Key</th>
              <th className="px-3 py-2 font-semibold">KO</th>
              <th className="px-3 py-2 font-semibold">EN</th>
              <th className="px-3 py-2 font-semibold">ZH</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-line align-top">
                <td className="px-3 py-2 font-mono text-xs">{row.key}</td>
                {LANGS.map((lang) => (
                  <td key={lang} className="px-3 py-2">
                    <textarea
                      className="w-full min-w-[180px] rounded border border-line px-2 py-1 text-xs"
                      rows={2}
                      placeholder={row.values[lang]}
                      value={draftValue(row.key, lang)}
                      onChange={(e) => setDraft(row.key, lang, e.target.value)}
                    />
                  </td>
                ))}
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => save(row.key)}
                    disabled={saving === row.key || !drafts[row.key]}
                    className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {saving === row.key ? "저장중" : "저장"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
