"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddDocForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vector-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          metadata: {
            title: title || "제목 없음",
            tags: tags || "",
            createdAt: new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) {
        // 예전에는 서버가 준 사유를 버리고 "failed" 만 보여줬다.
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `추가 실패 (${res.status})`);
      }
      setContent("");
      setTitle("");
      setTags("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "문서를 추가하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-text-strong">제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="ui-input mt-1 w-full"
          placeholder="문서 제목"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-strong">태그</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="ui-input mt-1 w-full"
          placeholder="쉼표로 구분 (예: 비자,체류)"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-strong">내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="ui-input mt-1 w-full"
          placeholder="검색 색인에 넣을 문서 내용"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="ui-button-primary"
      >
        {submitting ? "추가 중…" : "문서 추가"}
      </button>
    </form>
  );
}
