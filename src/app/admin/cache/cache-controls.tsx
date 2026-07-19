"use client";

import { useState, useTransition } from "react";

export function CacheControls() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClear = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/cache/clear", { method: "POST" });
        const data = await res.json();
        setMessage(
          data.success ? "캐시를 비웠습니다." : "캐시 비우기에 실패했습니다."
        );
      } catch {
        setMessage("캐시 비우기에 실패했습니다.");
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClear}
        disabled={isPending}
        className="text-sm px-3 py-1.5 border rounded"
      >
        {isPending ? "비우는 중…" : "전체 비우기"}
      </button>
      {message ? (
        <span className="text-xs text-muted-foreground">{message}</span>
      ) : null}
    </div>
  );
}
