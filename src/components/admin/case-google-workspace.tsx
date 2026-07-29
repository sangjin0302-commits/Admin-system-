"use client";

import { useRef, useState } from "react";

/**
 * 사건 상세 헤더의 구글 워크스페이스 액션.
 *  - 구글 문서 생성(위임장 / 상담요약) → 사건 Drive 폴더에 저장, 새 탭 열기
 *  - Drive 파일 첨부 → 사건 폴더에 업로드
 * 구글 미연결이면 409 로 안내한다.
 */
export function CaseGoogleWorkspace({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function genDoc(docType: "power_of_attorney" | "consult_summary") {
    setBusy(true);
    setOpen(false);
    setNote(null);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/google-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType })
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !j.ok || !j.url) {
        setNote(j.error ?? "문서 생성 실패 — 구글 연결을 확인하세요.");
        return;
      }
      window.open(j.url, "_blank", "noopener");
      setNote("구글 문서 생성 완료 — 새 탭에서 열림.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    setBusy(true);
    setNote(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/cases/${caseId}/drive-upload`, {
        method: "POST",
        body: fd
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        webViewLink?: string | null;
        error?: string;
      };
      if (!res.ok || !j.ok) {
        setNote(j.error ?? "업로드 실패 — 구글 연결을 확인하세요.");
        return;
      }
      setNote(
        j.webViewLink
          ? `업로드 완료: ${file.name}`
          : `업로드 완료: ${file.name} (링크 없음)`
      );
      if (j.webViewLink) window.open(j.webViewLink, "_blank", "noopener");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
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
        {busy ? "처리 중…" : "구글 ▾"}
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-52 rounded-md border border-line bg-surface shadow-md">
          <button
            type="button"
            onClick={() => genDoc("power_of_attorney")}
            className="block w-full px-3 py-2 text-left text-sm text-text-strong hover:bg-surface-muted"
          >
            위임장 (구글 문서)
          </button>
          <button
            type="button"
            onClick={() => genDoc("consult_summary")}
            className="block w-full px-3 py-2 text-left text-sm text-text-strong hover:bg-surface-muted"
          >
            상담 요약서 (구글 문서)
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              fileRef.current?.click();
            }}
            className="block w-full px-3 py-2 text-left text-sm text-text-strong hover:bg-surface-muted"
          >
            Drive에 파일 첨부…
          </button>
        </div>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />

      {note ? (
        <p className="absolute right-0 top-11 z-10 w-64 rounded-md border border-line bg-surface p-2 text-xs text-text-muted shadow-sm">
          {note}
        </p>
      ) : null}
    </div>
  );
}
