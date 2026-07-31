"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 사건 상세 헤더의 구글 워크스페이스 액션.
 *  - 내장 서식(위임장 / 상담요약) + 등록된 커스텀 서식으로 구글 문서 생성
 *  - 각 문서는 "문서 열기" 또는 "PDF로 받기" 선택 가능
 *  - Drive 파일 첨부 → 사건 폴더에 업로드
 * 구글 미연결이면 409 로 안내한다.
 */

interface TemplateItem {
  slug: string;
  name: string;
  variables: string[];
}

export function CaseGoogleWorkspace({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [asPdf, setAsPdf] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || templates.length > 0) return;
    void fetch("/api/admin/doc-templates")
      .then((r) => r.json())
      .then((j: { ok?: boolean; templates?: TemplateItem[] }) => {
        if (j?.ok && Array.isArray(j.templates)) setTemplates(j.templates);
      })
      .catch(() => undefined);
  }, [open, templates.length]);

  async function generate(payload: { docType?: string; templateSlug?: string }, label: string) {
    setBusy(true);
    setOpen(false);
    setNote(null);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/google-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, format: asPdf ? "pdf" : "doc" })
      });

      // PDF 응답이면 blob 다운로드.
      const ct = res.headers.get("content-type") ?? "";
      if (res.ok && ct.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${label}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setNote(`PDF 생성 완료: ${label}`);
        return;
      }

      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !j.ok || !j.url) {
        setNote(j.error ?? "문서 생성 실패 — 구글 연결을 확인하세요.");
        return;
      }
      window.open(j.url, "_blank", "noopener");
      setNote(`구글 문서 생성 완료: ${label}`);
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
      setNote(`업로드 완료: ${file.name}`);
      if (j.webViewLink) window.open(j.webViewLink, "_blank", "noopener");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const itemClass =
    "block w-full px-3 py-2 text-left text-sm text-text-strong hover:bg-surface-muted";

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
        <div className="absolute right-0 z-10 mt-1 w-60 rounded-md border border-line bg-surface py-1 shadow-md">
          <label className="flex items-center gap-2 px-3 py-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={asPdf}
              onChange={(e) => setAsPdf(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            PDF로 받기 (체크 해제 시 구글 문서)
          </label>
          <div className="my-1 border-t border-line" />

          <button type="button" onClick={() => generate({ docType: "power_of_attorney" }, "위임장")} className={itemClass}>
            위임장
          </button>
          <button type="button" onClick={() => generate({ docType: "consult_summary" }, "상담 요약서")} className={itemClass}>
            상담 요약서
          </button>

          {templates.length > 0 ? (
            <>
              <div className="my-1 border-t border-line" />
              <p className="px-3 py-1 text-[11px] font-semibold uppercase text-text-muted">내 서식</p>
              {templates.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => generate({ templateSlug: t.slug }, t.name)}
                  className={itemClass}
                >
                  {t.name}
                </button>
              ))}
            </>
          ) : null}

          <div className="my-1 border-t border-line" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              fileRef.current?.click();
            }}
            className={itemClass}
          >
            Drive에 파일 첨부…
          </button>
          <a href="/admin/integrations/doc-templates" className={`${itemClass} text-primary`}>
            서식 관리 →
          </a>
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
