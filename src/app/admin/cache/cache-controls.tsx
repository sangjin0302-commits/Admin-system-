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
        setMessage(data.success ? "Cache cleared." : "Failed to clear cache.");
      } catch {
        setMessage("Failed to clear cache.");
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
        {isPending ? "Clearing..." : "Clear All"}
      </button>
      {message ? (
        <span className="text-xs text-muted-foreground">{message}</span>
      ) : null}
    </div>
  );
}
