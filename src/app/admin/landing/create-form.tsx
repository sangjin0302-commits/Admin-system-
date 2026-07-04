"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateLandingForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title })
      });
      if (res.ok) {
        setSlug("");
        setTitle("");
        router.push(`/admin/landing/${encodeURIComponent(slug)}`);
        router.refresh();
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "생성 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface-muted/30 p-4">
      <label className="text-sm">
        <span className="block font-semibold text-text-strong">Slug</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value.trim().toLowerCase())}
          placeholder="visa-korea"
          className="mt-1 h-10 w-48 rounded-lg border border-line bg-surface px-3 text-sm"
          required
        />
      </label>
      <label className="flex-1 text-sm">
        <span className="block font-semibold text-text-strong">제목</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="비자 문제, 2주 안에 방향을 드립니다"
          className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
          required
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
      >
        + 새 랜딩 만들기
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
