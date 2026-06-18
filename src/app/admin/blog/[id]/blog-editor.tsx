"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type PostData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string;
  published: boolean;
} | null;

export function BlogEditor({ post }: { post: PostData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [category, setCategory] = useState(post?.category ?? "general");
  const [tags, setTags] = useState(post?.tags ?? "[]");
  const [published, setPublished] = useState(post?.published ?? false);

  const autoSlug = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("제목과 본문을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: post ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post?.id,
          title,
          slug: slug || autoSlug(title),
          excerpt,
          body,
          category,
          tags,
          published,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "저장 실패");
        return;
      }
      toast.success(post ? "수정 완료" : "작성 완료");
      router.push("/admin/blog");
      router.refresh();
    } catch {
      toast.error("저장 중 오류 발생");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-text-muted">제목</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!post) setSlug(autoSlug(e.target.value));
              }}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">슬러그</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
            >
              <option value="general">일반</option>
              <option value="visa">비자/체류</option>
              <option value="appeal">행정심판</option>
              <option value="contract">계약/사실조사</option>
              <option value="license">인허가</option>
              <option value="news">뉴스</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">태그 (JSON)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-mono"
              placeholder='["비자", "체류"]'
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-text-muted">발췌</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-text-muted">본문 (Markdown)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            <span className="text-text-strong">공개</span>
          </label>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-text-strong disabled:opacity-50"
          >
            {saving ? "저장 중..." : post ? "수정" : "작성"}
          </button>
        </div>
      </div>
    </div>
  );
}
