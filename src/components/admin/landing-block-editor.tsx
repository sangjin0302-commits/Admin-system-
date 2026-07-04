"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { LandingBlock, LandingBlockType, LandingPageRecord } from "@/lib/services/landing-page-service";

type StatItem = { value: string; label: string };
type FaqItem = { q: string; a: string };

function newBlock(type: LandingBlockType): LandingBlock {
  const id = `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case "hero":
      return {
        id,
        type,
        data: { eyebrow: "", title: "", subtitle: "", ctaLabel: "무료 검토 신청", ctaHref: "/intake" }
      };
    case "stats":
      return {
        id,
        type,
        data: {
          title: "숫자로 보는 신뢰",
          items: [
            { value: "500+", label: "처리 사건" },
            { value: "24h", label: "회신 시간" }
          ] as StatItem[]
        }
      };
    case "testimonial":
      return { id, type, data: { author: "", quote: "", context: "" } };
    case "faq":
      return {
        id,
        type,
        data: {
          title: "자주 묻는 질문",
          items: [{ q: "", a: "" }] as FaqItem[]
        }
      };
    case "cta":
      return {
        id,
        type,
        data: { title: "지금 시작하세요", subtitle: "", ctaLabel: "무료 검토 신청", ctaHref: "/intake" }
      };
  }
}

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asStatItems(v: unknown): StatItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
    .map((i) => ({ value: asStr(i.value), label: asStr(i.label) }));
}

function asFaqItems(v: unknown): FaqItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
    .map((i) => ({ q: asStr(i.q), a: asStr(i.a) }));
}

const BLOCK_TYPES: { type: LandingBlockType; label: string }[] = [
  { type: "hero", label: "Hero (제목/부제/CTA)" },
  { type: "stats", label: "Stats (통계 리스트)" },
  { type: "testimonial", label: "Testimonial (후기)" },
  { type: "faq", label: "FAQ (Q&A)" },
  { type: "cta", label: "CTA (콜투액션 배너)" }
];

export function LandingBlockEditor({ landing }: { landing: LandingPageRecord }) {
  const router = useRouter();
  const [title, setTitle] = useState(landing.title);
  const [blocks, setBlocks] = useState<LandingBlock[]>(landing.blocks);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [addType, setAddType] = useState<LandingBlockType>("hero");

  function updateBlockData(id: string, patch: Record<string, unknown>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...patch } } : b)));
    setStatus("idle");
  }
  function move(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const clone = [...prev];
      const tmp = clone[idx];
      clone[idx] = clone[next];
      clone[next] = tmp;
      return clone;
    });
    setStatus("idle");
  }
  function remove(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setStatus("idle");
  }
  function add() {
    setBlocks((prev) => [...prev, newBlock(addType)]);
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/admin/landing/${encodeURIComponent(landing.slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, blocks })
      });
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) router.refresh();
    } catch {
      setStatus("error");
    }
  }

  async function del() {
    if (!confirm(`정말 "${landing.slug}" 랜딩 페이지를 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/landing/${encodeURIComponent(landing.slug)}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/landing");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <label className="block text-sm font-semibold text-text-strong">페이지 제목</label>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setStatus("idle");
          }}
        />
        <p className="mt-2 text-xs text-text-muted">
          공개 URL: <code>/l/{landing.slug}</code>
        </p>
      </div>

      <div className="space-y-4">
        {blocks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-surface-muted/40 p-6 text-center text-sm text-text-muted">
            아직 블록이 없습니다. 아래에서 추가하세요.
          </div>
        )}
        {blocks.map((b, i) => (
          <div key={b.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  #{i + 1} · {b.type}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={() => move(b.id, -1)} className="rounded border border-line px-2 py-1">
                  ↑
                </button>
                <button type="button" onClick={() => move(b.id, 1)} className="rounded border border-line px-2 py-1">
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(b.id)}
                  className="rounded border border-red-300 px-2 py-1 text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
            <div className="mt-4">
              <BlockForm block={b} onChange={(patch) => updateBlockData(b.id, patch)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <span className="text-sm font-semibold">블록 추가:</span>
        <select
          value={addType}
          onChange={(e) => setAddType(e.target.value as LandingBlockType)}
          className="h-10 rounded-lg border border-line bg-surface px-3 text-sm"
        >
          {BLOCK_TYPES.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={add} className="h-10 rounded-lg border border-primary bg-primary px-4 text-sm font-semibold text-white">
          + 추가
        </button>
      </div>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-panel">
        <div className="text-sm text-text-muted">
          {status === "saving" && "저장 중..."}
          {status === "saved" && <span className="text-green-600">저장되었습니다.</span>}
          {status === "error" && <span className="text-red-600">저장 실패.</span>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={del} className="h-11 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-600">
            페이지 삭제
          </button>
          <button
            type="button"
            onClick={save}
            disabled={status === "saving"}
            className="h-11 rounded-lg bg-primary px-6 text-sm font-bold text-white disabled:opacity-60"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );

  function BlockForm({ block, onChange }: { block: LandingBlock; onChange: (patch: Record<string, unknown>) => void }) {
    const { type, data } = block;
    if (type === "hero") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Eyebrow (상단 짧은 문구)" value={asStr(data.eyebrow)} onChange={(v) => onChange({ eyebrow: v })} />
          <Input label="CTA 라벨" value={asStr(data.ctaLabel)} onChange={(v) => onChange({ ctaLabel: v })} />
          <Input label="제목" value={asStr(data.title)} onChange={(v) => onChange({ title: v })} className="sm:col-span-2" />
          <TextArea label="부제" value={asStr(data.subtitle)} onChange={(v) => onChange({ subtitle: v })} className="sm:col-span-2" />
          <Input label="CTA 링크 (기본 /intake)" value={asStr(data.ctaHref)} onChange={(v) => onChange({ ctaHref: v })} className="sm:col-span-2" />
        </div>
      );
    }
    if (type === "stats") {
      const items = asStatItems(data.items);
      return (
        <div className="space-y-3">
          <Input label="섹션 제목" value={asStr(data.title)} onChange={(v) => onChange({ title: v })} />
          {items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="값 (500+)"
                value={it.value}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...it, value: e.target.value };
                  onChange({ items: next });
                }}
                className="h-10 w-40 rounded-lg border border-line bg-surface px-3 text-sm"
              />
              <input
                placeholder="라벨 (처리 사건)"
                value={it.label}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...it, label: e.target.value };
                  onChange({ items: next });
                }}
                className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => onChange({ items: items.filter((_, j) => j !== i) })}
                className="rounded border border-red-300 px-2 text-xs text-red-600"
              >
                삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ items: [...items, { value: "", label: "" }] })}
            className="rounded border border-line px-3 py-1 text-xs"
          >
            + 항목 추가
          </button>
        </div>
      );
    }
    if (type === "testimonial") {
      return (
        <div className="grid gap-3">
          <Input label="작성자" value={asStr(data.author)} onChange={(v) => onChange({ author: v })} />
          <TextArea label="후기 본문" value={asStr(data.quote)} onChange={(v) => onChange({ quote: v })} />
          <Input label="맥락 (분야, 지역 등)" value={asStr(data.context)} onChange={(v) => onChange({ context: v })} />
        </div>
      );
    }
    if (type === "faq") {
      const items = asFaqItems(data.items);
      return (
        <div className="space-y-3">
          <Input label="섹션 제목" value={asStr(data.title)} onChange={(v) => onChange({ title: v })} />
          {items.map((it, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-line p-3">
              <input
                placeholder="질문"
                value={it.q}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...it, q: e.target.value };
                  onChange({ items: next });
                }}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
              />
              <textarea
                placeholder="답변"
                value={it.a}
                rows={2}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...it, a: e.target.value };
                  onChange({ items: next });
                }}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => onChange({ items: items.filter((_, j) => j !== i) })}
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-600"
              >
                삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ items: [...items, { q: "", a: "" }] })}
            className="rounded border border-line px-3 py-1 text-xs"
          >
            + Q&A 추가
          </button>
        </div>
      );
    }
    // cta
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="제목" value={asStr(data.title)} onChange={(v) => onChange({ title: v })} className="sm:col-span-2" />
        <TextArea label="부제" value={asStr(data.subtitle)} onChange={(v) => onChange({ subtitle: v })} className="sm:col-span-2" />
        <Input label="CTA 라벨" value={asStr(data.ctaLabel)} onChange={(v) => onChange({ ctaLabel: v })} />
        <Input label="CTA 링크" value={asStr(data.ctaHref)} onChange={(v) => onChange({ ctaHref: v })} />
      </div>
    );
  }
}

function Input({
  label,
  value,
  onChange,
  className = ""
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="block font-semibold text-text-strong">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  className = ""
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="block font-semibold text-text-strong">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
      />
    </label>
  );
}
