"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

const DOC_OPTIONS = [
  { code: "resident_extract", label: "주민등록등본" },
  { code: "resident_summary", label: "주민등록초본" },
  { code: "family_relation", label: "가족관계증명서" },
  { code: "biz_registration", label: "사업자등록증명" },
  { code: "seal_certificate", label: "인감증명" },
] as const;

export function Gov24RequestCard({ caseId }: { caseId: string }) {
  const [type, setType] = useState<(typeof DOC_OPTIONS)[number]["code"]>(DOC_OPTIONS[0].code);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/portal/gov24", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ownerConsent: true, caseId }),
      });
      const json = await res.json();
      setMessage(json.ok ? (json.instructions as string) ?? "요청되었습니다" : json.error ?? "실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-7">
      <h2 className="font-serif text-lg font-bold text-primary">정부24 서류 요청</h2>
      <p className="mt-2 text-sm text-text-muted">
        주민등록등본 등 필요 서류를 정부24 창구에 요청할 수 있습니다. 본인 동의로 간주됩니다.
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <select
          className="rounded-lg border border-gold/30 bg-white px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as (typeof DOC_OPTIONS)[number]["code"])}
        >
          {DOC_OPTIONS.map((d) => (
            <option key={d.code} value={d.code}>{d.label}</option>
          ))}
        </select>
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-text-strong disabled:opacity-50"
        >
          요청하기
        </button>
      </div>
      {message && <p className="mt-3 text-xs text-text-muted">{message}</p>}
    </Card>
  );
}
