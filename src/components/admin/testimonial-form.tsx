"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";

type Testimonial = {
  id: string;
  category: string;
  quote: string;
  author: string;
  context: string;
  published: boolean;
  sortOrder: number;
};

const CATEGORIES = [
  { value: "VISA_STAY", label: "비자/체류" },
  { value: "ADMIN_APPEAL", label: "행정심판" },
  { value: "CONTRACT_INVESTIGATION", label: "계약/사실조사" },
  { value: "LICENSE_PERMIT", label: "인허가" },
];

export function TestimonialForm({ testimonial }: { testimonial: Testimonial | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      category: fd.get("category") as string,
      quote: fd.get("quote") as string,
      author: fd.get("author") as string,
      context: fd.get("context") as string,
      published: fd.get("published") === "on",
      sortOrder: Number(fd.get("sortOrder") || 0),
    };

    try {
      const url = testimonial
        ? `/api/admin/testimonials/${testimonial.id}`
        : "/api/admin/testimonials";
      const res = await fetch(url, {
        method: testimonial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "저장 실패");
      }

      router.push("/admin/testimonials");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!testimonial || !confirm("정말 삭제하시겠습니까?")) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/testimonials/${testimonial.id}`, { method: "DELETE" });
      router.push("/admin/testimonials");
      router.refresh();
    } catch {
      setError("삭제 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-bold text-text-strong">분야</label>
          <select
            name="category"
            defaultValue={testimonial?.category ?? "VISA_STAY"}
            className="mt-1 block w-full rounded-lg border border-gold/30 bg-surface px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-text-strong">후기 내용</label>
          <textarea
            name="quote"
            defaultValue={testimonial?.quote ?? ""}
            required
            rows={4}
            className="mt-1 block w-full rounded-lg border border-gold/30 bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-text-strong">작성자</label>
            <input
              name="author"
              defaultValue={testimonial?.author ?? ""}
              required
              className="mt-1 block w-full rounded-lg border border-gold/30 bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-strong">맥락</label>
            <input
              name="context"
              defaultValue={testimonial?.context ?? ""}
              required
              placeholder="예: D-8 비자 변경 의뢰"
              className="mt-1 block w-full rounded-lg border border-gold/30 bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-text-strong">정렬 순서</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={testimonial?.sortOrder ?? 0}
              className="mt-1 block w-full rounded-lg border border-gold/30 bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              name="published"
              type="checkbox"
              defaultChecked={testimonial?.published ?? true}
              className="h-4 w-4 rounded border-gold/40"
            />
            <label className="text-sm font-semibold text-text-strong">홈페이지 공개</label>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center rounded-full bg-primary px-6 text-xs font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "저장 중..." : testimonial ? "수정" : "등록"}
          </button>

          {testimonial && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex h-9 items-center rounded-full border border-red-300 px-5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              삭제
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}
