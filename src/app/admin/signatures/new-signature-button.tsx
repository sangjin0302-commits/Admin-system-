"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewSignatureButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentTitle: fd.get("documentTitle"),
          signerName: fd.get("signerName"),
          signerEmail: fd.get("signerEmail"),
        }),
      });

      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-text-strong"
      >
        + 서명 요청
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <input
        name="documentTitle"
        placeholder="문서 제목"
        required
        className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
      />
      <input
        name="signerName"
        placeholder="서명자 이름"
        required
        className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
      />
      <input
        name="signerEmail"
        type="email"
        placeholder="서명자 이메일"
        required
        className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "생성 중…" : "요청 생성"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-line px-4 py-2 text-sm text-text-muted"
        >
          취소
        </button>
      </div>
    </form>
  );
}
