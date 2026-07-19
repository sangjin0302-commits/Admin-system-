"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/ui/card";

export function NewCampaignForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<"all" | "won" | "active" | "new">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Card className="p-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          새 캠페인
        </button>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          bodyHtml: body,
          targetSegment: segment,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setName("");
      setSubject("");
      setBody("");
      setSegment("all");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="text-sm font-semibold text-text-strong">새 캠페인</h2>
        <div>
          <label className="block text-xs text-text-muted">캠페인명</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded border border-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">제목</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="mt-1 w-full rounded border border-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">본문 (HTML)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            className="mt-1 w-full rounded border border-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">대상 세그먼트</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value as typeof segment)}
            className="mt-1 w-full rounded border border-line px-3 py-2 text-sm"
          >
            <option value="all">전체</option>
            <option value="won">수임 완료</option>
            <option value="active">진행 중</option>
            <option value="new">신규</option>
          </select>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "생성 중…" : "생성"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded border border-line px-4 py-2 text-sm"
          >
            취소
          </button>
        </div>
      </form>
    </Card>
  );
}
