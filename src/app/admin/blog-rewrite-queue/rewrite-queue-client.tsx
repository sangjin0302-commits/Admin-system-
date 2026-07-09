"use client";

import { useState } from "react";

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  body: string;
};

export function RewriteQueueClient({ posts }: { posts: BlogRow[] }) {
  const [expanded, setExpanded] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  async function handleRewrite(post: BlogRow) {
    setLoading((p) => ({ ...p, [post.id]: true }));
    try {
      const excerpt = post.body.slice(0, 2000);
      const res = await fetch("/api/admin/ai/tone-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: excerpt, tone: "friendly" }),
      });
      if (!res.ok) throw new Error("API 오류");
      const data = await res.json();
      setExpanded((p) => ({ ...p, [post.id]: data.adjusted }));
    } catch {
      setExpanded((p) => ({ ...p, [post.id]: "리라이트 실패. 다시 시도해 주세요." }));
    } finally {
      setLoading((p) => ({ ...p, [post.id]: false }));
    }
  }

  return (
    <table className="w-full text-sm">
      <thead className="text-xs text-text-muted">
        <tr>
          <th className="text-left py-2">제목</th>
          <th className="text-left py-2">URL</th>
          <th className="text-right py-2">조회수</th>
          <th className="text-right py-2">액션</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id} className="border-t border-line align-top">
            <td className="py-2 max-w-xs truncate">{post.title}</td>
            <td className="py-2 max-w-xs truncate text-blue-600">
              <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                /blog/{post.slug}
              </a>
            </td>
            <td className="text-right py-2">{post.viewCount.toLocaleString()}</td>
            <td className="text-right py-2">
              <button
                onClick={() => handleRewrite(post)}
                disabled={loading[post.id]}
                className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading[post.id] ? "처리중..." : "AI 리라이트"}
              </button>
            </td>
          </tr>
        ))}
        {posts.map(
          (post) =>
            expanded[post.id] && (
              <tr key={`${post.id}-preview`} className="bg-surface-alt">
                <td colSpan={4} className="p-4">
                  <p className="ui-kicker mb-2">리라이트 미리보기</p>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {expanded[post.id]}
                  </div>
                </td>
              </tr>
            )
        )}
      </tbody>
    </table>
  );
}
