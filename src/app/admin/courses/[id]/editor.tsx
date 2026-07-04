"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Course, CourseCategory } from "@/lib/services/course-service";

interface Props {
  initial: Course;
}

export function CourseEditor({ initial }: Props) {
  const router = useRouter();
  const [c, setC] = useState<Course>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function upd<K extends keyof Course>(k: K, v: Course[K]) {
    setC((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/courses/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      const json = await res.json();
      if (json.ok) setMsg("저장 완료");
      else setMsg("저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/courses/${c.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) router.push("/admin/courses");
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">제목</span>
        <input
          value={c.title}
          onChange={(e) => upd("title", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">가격 (KRW)</span>
        <input
          type="number"
          value={c.price}
          onChange={(e) => upd("price", Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">분류</span>
        <select
          value={c.category}
          onChange={(e) => upd("category", e.target.value as CourseCategory)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        >
          <option value="visa">비자실무</option>
          <option value="appeal">행정심판</option>
          <option value="corporate">법인</option>
          <option value="other">기타</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">썸네일 URL</span>
        <input
          value={c.thumbnailUrl ?? ""}
          onChange={(e) => upd("thumbnailUrl", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">영상 URL (프라이빗 링크)</span>
        <input
          value={c.videoUrl}
          onChange={(e) => upd("videoUrl", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">설명</span>
        <textarea
          rows={4}
          value={c.description}
          onChange={(e) => upd("description", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">커리큘럼 (선택)</span>
        <textarea
          rows={4}
          value={c.curriculum ?? ""}
          onChange={(e) => upd("curriculum", e.target.value)}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={c.published}
          onChange={(e) => upd("published", e.target.checked)}
        />
        <span className="text-sm font-semibold">공개</span>
      </label>
      {msg && <p className="text-sm text-text-muted">{msg}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button
          type="button"
          onClick={remove}
          className="rounded-lg border border-red-400 px-4 py-2 text-sm font-bold text-red-500"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
