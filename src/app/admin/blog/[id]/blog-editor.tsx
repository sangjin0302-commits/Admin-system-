"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { PUBLIC_CATEGORY_LABEL, type PublicCategory } from "@/lib/services/blog-categorizer";

/** tags 는 DB에 JSON 문자열로 저장된다. 표시용 배열로 파싱(구형 콤마문자열도 흡수). */
function parseTags(raw: string): string[] {
  try {
    const a = JSON.parse(raw);
    if (Array.isArray(a)) return a.filter((x): x is string => typeof x === "string");
  } catch {
    /* JSON 아니면 콤마 분리로 폴백 */
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

type PostData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string;
  published: boolean;
  pinned: boolean;
  sortOrder: number;
} | null;

export function BlogEditor({ post }: { post: PostData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [category, setCategory] = useState(post?.category ?? "other");
  const [tags, setTags] = useState(post?.tags ?? "[]");
  // 쉼표로 편하게 입력 → 내부 tags(JSON)로 동기화.
  const [tagText, setTagText] = useState(parseTags(post?.tags ?? "[]").join(", "));
  const [published, setPublished] = useState(post?.published ?? false);
  const [pinned, setPinned] = useState(post?.pinned ?? false);
  const [sortOrder, setSortOrder] = useState(String(post?.sortOrder ?? 0));

  const onTagTextChange = (v: string) => {
    setTagText(v);
    setTags(JSON.stringify(v.split(",").map((s) => s.trim()).filter(Boolean)));
  };

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
          pinned,
          sortOrder: Number.parseInt(sortOrder, 10) || 0,
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
              {/* 공개 사이트가 쓰는 5대 분야 + 기타 (라벨은 공개 페이지와 동일하게 유지) */}
              {(Object.entries(PUBLIC_CATEGORY_LABEL) as [PublicCategory, string][]).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
              {/* 현재 값이 위 6개에 없으면(구형 general/news 등) 잃지 않도록 노출 */}
              {!(category in PUBLIC_CATEGORY_LABEL) && <option value={category}>{category}</option>}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">키워드/태그 (쉼표로 구분)</label>
            <input
              value={tagText}
              onChange={(e) => onTagTextChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm"
              placeholder="비자, 체류, D-2"
            />
            {parseTags(tags).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parseTags(tags).map((t) => (
                  <span key={t} className="rounded-full bg-gold-soft/40 px-2 py-0.5 text-[11px] font-semibold text-gold-deep">
                    #{t}
                  </span>
                ))}
              </div>
            )}
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded border-line"
              />
              <span className="text-text-strong">공개</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 rounded border-line"
              />
              <span className="text-text-strong">상단 고정(pin)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-text-muted">정렬순서</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-20 rounded border border-line bg-surface-muted px-2 py-1 text-sm"
                title="작을수록 앞. 고정 글끼리·같은 값이면 최신순."
              />
            </label>
          </div>

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
