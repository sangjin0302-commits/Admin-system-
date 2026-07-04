"use client";

import { useState } from "react";

export function PromoteButton({ term }: { term: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [slug, setSlug] = useState<string | null>(null);

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch("/api/admin/marketing/search-trends/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term }),
      });
      const data = await res.json();
      if (data.ok) {
        setSlug(data.slug ?? null);
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <span className="text-xs text-text-muted">
        초안 생성됨{slug ? ` (${slug})` : ""}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold hover:bg-surface-muted/40 disabled:opacity-60"
    >
      {state === "loading" ? "생성 중..." : state === "error" ? "재시도" : "새 블로그 소재로 추가"}
    </button>
  );
}
