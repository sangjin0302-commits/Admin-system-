"use client";

import { useState } from "react";

type Slide = { slideNumber: number; title: string; body: string };

const SLIDE_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-teal-600",
];

export function CardNewsGenerator({ blogId }: { blogId: string }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/blog-card-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId }),
      });
      if (!res.ok) throw new Error("API 오류");
      const data = await res.json();
      setSlides(data.slides ?? []);
    } catch {
      setError("카드뉴스 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    const text = slides
      .map((s) => `[슬라이드 ${s.slideNumber}]\n${s.title}\n${s.body}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-4">
      <button
        onClick={generate}
        disabled={loading}
        className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? "생성 중..." : "카드뉴스 생성"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {slides.length > 0 && (
        <>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {slides.map((s, i) => (
              <div
                key={s.slideNumber}
                className={`${SLIDE_COLORS[i % SLIDE_COLORS.length]} flex-shrink-0 w-64 h-64 rounded-xl p-5 text-white flex flex-col justify-between shadow-lg`}
              >
                <div>
                  <p className="text-xs opacity-75">슬라이드 {s.slideNumber}</p>
                  <p className="text-lg font-bold mt-1 leading-tight">{s.title}</p>
                </div>
                <p className="text-sm opacity-90 leading-snug">{s.body}</p>
              </div>
            ))}
          </div>
          <button
            onClick={copyAll}
            className="rounded border border-line px-3 py-1.5 text-xs hover:bg-surface-alt"
          >
            전체 텍스트 복사
          </button>
        </>
      )}
    </div>
  );
}
