"use client";

import { useState } from "react";

/**
 * 사건대장을 구글 Sheets 로 내보내는 버튼.
 * POST 응답의 URL 을 새 탭으로 연다. 구글 미연결이면 409 안내.
 */
export function SheetsExportButton({
  category,
  query
}: {
  category?: string;
  query?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (query) params.set("q", query);
      const qs = params.toString();
      const res = await fetch(`/api/admin/cases/export-sheets${qs ? `?${qs}` : ""}`, {
        method: "POST"
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !j.ok || !j.url) {
        alert(j.error ?? "구글 시트 내보내기 실패 — 구글 연결을 확인하세요.");
        return;
      }
      window.open(j.url, "_blank", "noopener");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted disabled:opacity-50"
    >
      {busy ? "내보내는 중…" : "구글 시트 내보내기"}
    </button>
  );
}
