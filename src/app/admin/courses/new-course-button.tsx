"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewCourseButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "새 강의", price: 0, category: "visa", published: false }),
      });
      const json = await res.json();
      if (json.ok) router.push(`/admin/courses/${json.course.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={create}
      disabled={busy}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
    >
      + 새 강의
    </button>
  );
}
