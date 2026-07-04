"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type FeatureDefinition = {
  key: string;
  label: string;
  category: "marketing" | "operations" | "ux";
  default: boolean;
  description?: string;
};

const CATEGORY_LABEL: Record<FeatureDefinition["category"], string> = {
  marketing: "마케팅 · 성장",
  operations: "운영 · 자동화",
  ux: "사용자 경험",
};

const CATEGORY_ORDER: FeatureDefinition["category"][] = ["marketing", "operations", "ux"];

export function FeatureTogglePanel() {
  const [registry, setRegistry] = useState<FeatureDefinition[]>([]);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/features", { cache: "no-store" });
        if (!res.ok) throw new Error("불러오기 실패");
        const data = await res.json();
        if (cancelled) return;
        setRegistry(Array.isArray(data.registry) ? data.registry : []);
        setFlags(data.flags ?? {});
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<FeatureDefinition["category"], FeatureDefinition[]>();
    for (const f of registry) {
      const arr = map.get(f.category) ?? [];
      arr.push(f);
      map.set(f.category, arr);
    }
    return map;
  }, [registry]);

  function toggle(key: string) {
    const next = !(flags[key] ?? false);
    setFlags((prev) => ({ ...prev, [key]: next }));

    if (debounceRef.current[key]) {
      clearTimeout(debounceRef.current[key]);
    }
    debounceRef.current[key] = setTimeout(async () => {
      setSaving((prev) => ({ ...prev, [key]: true }));
      try {
        const res = await fetch("/api/admin/features", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, enabled: next }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "저장 실패");
        }
        const data = await res.json();
        if (data.flags) setFlags(data.flags);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장 실패");
        // 원복
        setFlags((prev) => ({ ...prev, [key]: !next }));
      } finally {
        setSaving((prev) => {
          const c = { ...prev };
          delete c[key];
          return c;
        });
      }
    }, 250);
  }

  if (loading) {
    return <div className="rounded-2xl border border-line bg-surface p-6 text-sm text-text-muted">로딩 중…</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped.get(cat) ?? [];
        if (items.length === 0) return null;
        return (
          <div key={cat} className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="text-base font-semibold text-text-strong">{CATEGORY_LABEL[cat]}</h3>
            <ul className="mt-4 divide-y divide-line">
              {items.map((f) => {
                const enabled = flags[f.key] ?? f.default;
                const isSaving = saving[f.key];
                return (
                  <li key={f.key} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-text-strong">{f.label}</p>
                        <span
                          className={
                            enabled
                              ? "rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                              : "rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                          }
                        >
                          {enabled ? "실행 중" : "꺼짐"}
                        </span>
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-mono text-text-muted">
                          {f.key}
                        </span>
                        {isSaving && <span className="text-[10px] text-text-muted">저장 중…</span>}
                      </div>
                      {f.description && (
                        <p className="mt-1 text-xs text-text-muted" title={f.description}>
                          {f.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`${f.label} 토글`}
                      onClick={() => toggle(f.key)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
                        enabled ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                          enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
