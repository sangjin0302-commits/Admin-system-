"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import type { PersonalizationVariant } from "@/lib/services/homepage-personalization-service";

type Props = {
  initialVariants: PersonalizationVariant[];
};

function emptyVariant(): PersonalizationVariant {
  return {
    id: `variant_${Date.now().toString(36)}`,
    name: "새 변형",
    trigger: {},
    heroBadge: "",
    heroTitle: "",
    heroDescription: "",
  };
}

function joinList(v: readonly string[] | undefined): string {
  return v?.join(", ") ?? "";
}

function splitList(v: string): string[] | undefined {
  const parts = v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

export function PersonalizationEditor({ initialVariants }: Props) {
  const [variants, setVariants] = useState<PersonalizationVariant[]>(initialVariants);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateVariant(idx: number, patch: Partial<PersonalizationVariant>) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }
  function updateTrigger(idx: number, patch: Partial<PersonalizationVariant["trigger"]>) {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, trigger: { ...v.trigger, ...patch } } : v)),
    );
  }
  function remove(idx: number) {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }
  function add() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/personalization", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variants }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "저장 실패");
      setMessage(`저장 완료 (${data.count ?? variants.length}개)`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-muted">총 {variants.length}개 variant</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={add}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            + variant 추가
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "전체 저장"}
          </button>
        </div>
      </div>
      {message && <p className="text-sm text-text-muted">{message}</p>}

      <div className="space-y-4">
        {variants.map((v, idx) => (
          <Card key={v.id + idx} className="space-y-3 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-text-muted">
                ID
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  value={v.id}
                  onChange={(e) => updateVariant(idx, { id: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold text-text-muted">
                이름
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  value={v.name}
                  onChange={(e) => updateVariant(idx, { name: e.target.value })}
                />
              </label>
            </div>

            <fieldset className="rounded border border-slate-200 p-3">
              <legend className="px-1 text-xs font-semibold text-text-muted">Trigger</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-text-muted">
                  키워드 (쉼표 구분)
                  <input
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    value={joinList(v.trigger.keywords)}
                    onChange={(e) => updateTrigger(idx, { keywords: splitList(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-text-muted">
                  Referrer 도메인 (쉼표)
                  <input
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    value={joinList(v.trigger.referrerDomains)}
                    onChange={(e) =>
                      updateTrigger(idx, { referrerDomains: splitList(e.target.value) })
                    }
                  />
                </label>
                <label className="text-xs text-text-muted">
                  UTM source (쉼표)
                  <input
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    value={joinList(v.trigger.utmSources)}
                    onChange={(e) => updateTrigger(idx, { utmSources: splitList(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-text-muted">
                  지역 (예: KR,US)
                  <input
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    value={joinList(v.trigger.regions)}
                    onChange={(e) => updateTrigger(idx, { regions: splitList(e.target.value) })}
                  />
                </label>
              </div>
            </fieldset>

            <div className="grid gap-3">
              <label className="text-xs font-semibold text-text-muted">
                Hero Badge
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  value={v.heroBadge ?? ""}
                  onChange={(e) => updateVariant(idx, { heroBadge: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold text-text-muted">
                Hero Title (줄바꿈 = 새 줄)
                <textarea
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  rows={3}
                  value={v.heroTitle ?? ""}
                  onChange={(e) => updateVariant(idx, { heroTitle: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold text-text-muted">
                Hero Description
                <textarea
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  rows={2}
                  value={v.heroDescription ?? ""}
                  onChange={(e) => updateVariant(idx, { heroDescription: e.target.value })}
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-xs text-red-600 hover:underline"
              >
                삭제
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
