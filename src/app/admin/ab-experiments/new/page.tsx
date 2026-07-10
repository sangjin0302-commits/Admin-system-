"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";

type VariantRow = { name: string; weight: string };

export default function NewABExperimentPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([
    { name: "control", weight: "1" },
    { name: "variant-a", weight: "1" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateVariant(i: number, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addVariant() {
    setVariants((rows) => [...rows, { name: `variant-${rows.length}`, weight: "1" }]);
  }

  function removeVariant(i: number) {
    setVariants((rows) => (rows.length <= 2 ? rows : rows.filter((_, idx) => idx !== i)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanVariants = variants.map((v) => v.name.trim()).filter(Boolean);
    if (!key.trim() || !name.trim() || cleanVariants.length < 2) {
      setError("key, name과 2개 이상 variant가 필요합니다");
      return;
    }
    const weights = variants.map((v) => Number(v.weight));
    if (weights.some((w) => !Number.isFinite(w) || w <= 0)) {
      setError("weight는 양수여야 합니다");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ab-experiments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: key.trim(),
          name: name.trim(),
          variants: cleanVariants,
          weights,
          active: true,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "저장 실패");
      } else {
        router.push("/admin/ab-experiments");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Marketing"
        title="신규 A/B 실험"
        description="SiteSetting `ab_experiments`에 저장되며 다음 요청부터 반영됩니다."
      />

      <Card className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-strong">key</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="cta-button-color"
              className="mt-1 w-full rounded border border-line px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-strong">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CTA 버튼 색상 실험"
              className="mt-1 w-full rounded border border-line px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-strong">Variants</label>
              <button
                type="button"
                onClick={addVariant}
                className="text-xs text-slate-600 underline"
              >
                + 추가
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={v.name}
                    onChange={(e) => updateVariant(i, { name: e.target.value })}
                    placeholder="이름"
                    className="flex-1 rounded border border-line px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={v.weight}
                    onChange={(e) => updateVariant(i, { weight: e.target.value })}
                    placeholder="가중치"
                    className="w-24 rounded border border-line px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    disabled={variants.length <= 2}
                    className="text-xs text-red-600 disabled:opacity-30"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-muted">
              가중치 합계 기준 비율로 트래픽이 분배됩니다.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/ab-experiments")}
              className="rounded border border-line px-4 py-2 text-sm"
            >
              취소
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
