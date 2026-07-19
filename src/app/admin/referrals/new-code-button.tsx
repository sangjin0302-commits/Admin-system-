"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/ui/card";

export function NewCodeButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrerEmail: email, referrerName: name }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGenerated(data?.code?.code ?? null);
      setEmail("");
      setName("");
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Card className="p-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          새 추천 코드 발급
        </button>
        {generated && (
          <p className="mt-3 text-sm">
            최근 발급 코드: <code className="font-mono">{generated}</code>
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="text-sm font-semibold text-text-strong">새 추천 코드</h2>
        <div>
          <label className="block text-xs text-text-muted">추천인 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded border border-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">추천인 이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded border border-line px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "발급 중…" : "발급"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded border border-line px-4 py-2 text-sm"
          >
            닫기
          </button>
        </div>
      </form>
    </Card>
  );
}
