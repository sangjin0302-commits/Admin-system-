"use client";

import { useState } from "react";

const TEMPLATE_OPTIONS = [
  { value: "POWER_OF_ATTORNEY", label: "위임장" },
  { value: "RETAINER_AGREEMENT", label: "수임계약서" },
  { value: "CONSENT_FORM", label: "개인정보 동의서" },
];

export function SendDelegationButton({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState("POWER_OF_ATTORNEY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(sendForSignature: boolean) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/delegation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          templateType: template,
          sendForSignature,
        }),
      });

      if (sendForSignature) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "발송 실패");
          return;
        }
        setOpen(false);
        window.location.reload();
      } else {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "PDF 생성 실패");
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-line bg-white px-2.5 py-1 text-xs hover:bg-surface-muted"
      >
        + 서명 발송
      </button>
    );
  }

  return (
    <div className="absolute right-4 top-16 z-20 w-72 rounded-lg border border-line bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-text-strong">문서 종류</p>
      <select
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        className="mb-2 w-full rounded border border-line bg-white px-2 py-1 text-sm"
      >
        {TEMPLATE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mb-2 text-xs text-rose-700">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => action(true)}
          disabled={busy}
          className="rounded bg-text-strong px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {busy ? "처리중…" : "PDF 생성 + 서명 발송"}
        </button>
        <button
          type="button"
          onClick={() => action(false)}
          disabled={busy}
          className="rounded border border-line px-3 py-1.5 text-sm"
        >
          PDF만 미리보기
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-3 py-1 text-xs text-text-muted"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
