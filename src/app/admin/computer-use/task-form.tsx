"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/computer-use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, instruction }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTitle("");
      setInstruction("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-text-muted">제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm"
          placeholder="예: 부동산 등기부 조회"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-muted">
          지시사항
        </label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          required
          rows={4}
          className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm"
          placeholder="에이전트가 브라우저에서 수행할 작업을 자연어로 설명하세요."
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="ui-button-primary">
        {loading ? "생성 중..." : "작업 생성"}
      </button>
    </form>
  );
}
