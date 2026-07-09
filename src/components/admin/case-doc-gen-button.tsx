"use client";

import { useState } from "react";

type DocType = "power_of_attorney" | "receipt";

export function CaseDocGenButton({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function generate(type: DocType) {
    setBusy(true);
    setOpen(false);
    try {
      let amount: number | undefined;
      if (type === "receipt") {
        const raw = window.prompt("수령 금액(원)을 입력하세요.", "0");
        if (raw === null) return;
        const parsed = Number(raw.replace(/[^0-9.-]/g, ""));
        amount = Number.isFinite(parsed) ? parsed : 0;
      }
      const res = await fetch(`/api/admin/cases/${caseId}/generate-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount })
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        alert(`문서 생성 실패: ${res.status} ${msg}`);
        return;
      }
      const html = await res.text();
      const w = window.open("", "_blank");
      if (!w) {
        alert("팝업이 차단되었습니다. 팝업을 허용해 주세요.");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="inline-flex h-10 items-center rounded-lg border border-gold/40 bg-surface px-4 text-sm font-medium text-primary transition hover:bg-gold-soft/30 disabled:opacity-50"
      >
        문서 생성 ▾
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-line bg-surface shadow-md">
          <button
            type="button"
            onClick={() => generate("power_of_attorney")}
            className="block w-full px-3 py-2 text-left text-sm text-text-strong hover:bg-surface-muted"
          >
            위임장
          </button>
          <button
            type="button"
            onClick={() => generate("receipt")}
            className="block w-full px-3 py-2 text-left text-sm text-text-strong hover:bg-surface-muted"
          >
            영수증
          </button>
        </div>
      ) : null}
    </div>
  );
}
