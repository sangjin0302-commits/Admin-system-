"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";


export function UploadClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("파일을 선택하세요.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);

    setLoading(true);
    const res = await fetch("/api/portal/upload", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);

    if (!data.ok) {
      setError(data.error ?? "업로드에 실패했습니다.");
      return;
    }
    setSuccess(`${data.file.fileName} 업로드 완료`);
    setFile(null);
    router.refresh();
  }

  return (
    <div className="ethos-card mt-8 p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xlsx"
          className="block w-full text-sm text-text file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-5 file:py-2.5 file:text-white hover:file:bg-text-strong"
        />

        {file && <p className="text-xs text-text-muted">{file.name} · {(file.size / 1024).toFixed(1)} KB</p>}

        {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>}

        <button
          type="submit"
          disabled={loading || !file}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-white hover:bg-text-strong disabled:opacity-50"
        >
          {loading ? "업로드 중..." : "업로드"}
        </button>

        <Link href="/portal" className="block text-center text-xs text-text-muted hover:text-primary">
          ← 포털 대시보드
        </Link>
      </form>
    </div>
  );
}
