"use client";

import { useState } from "react";
import type { Region, RegionConfig } from "@/lib/services/international-site-service";

export function RegionEditor({ code, initial }: { code: Region; initial: RegionConfig }) {
  const [cfg, setCfg] = useState<RegionConfig>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    const res = await fetch(`/api/admin/international-sites/${code}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setBusy(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-primary">
          {cfg.label} ({code.toUpperCase()})
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} />
          활성
        </label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Locale" value={cfg.locale} onChange={(v) => setCfg({ ...cfg, locale: v })} />
        <Field label="Currency" value={cfg.currency} onChange={(v) => setCfg({ ...cfg, currency: v })} />
        <Field label="Contact Email" value={cfg.contactEmail ?? ""} onChange={(v) => setCfg({ ...cfg, contactEmail: v })} />
        <Field label="Contact Phone" value={cfg.contactPhone ?? ""} onChange={(v) => setCfg({ ...cfg, contactPhone: v })} />
      </div>
      <div className="mt-3">
        <label className="text-xs text-text-muted">Hero Title</label>
        <input value={cfg.heroTitle ?? ""} onChange={(e) => setCfg({ ...cfg, heroTitle: e.target.value })} className="mt-1 w-full rounded border border-line px-3 py-2" />
      </div>
      <div className="mt-3">
        <label className="text-xs text-text-muted">Hero Description</label>
        <textarea value={cfg.heroDescription ?? ""} onChange={(e) => setCfg({ ...cfg, heroDescription: e.target.value })} rows={2} className="mt-1 w-full rounded border border-line px-3 py-2" />
      </div>
      <div className="mt-4">
        <button onClick={save} disabled={busy} className="rounded bg-primary px-4 py-2 font-bold text-white disabled:opacity-50">
          {busy ? "저장 중..." : "저장"}
        </button>
        {saved && <span className="ml-3 text-sm text-primary">저장됨</span>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-text-muted">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-line px-3 py-2" />
    </div>
  );
}
