"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** GSC 갭 검색어 → 원클릭 /keyword 랜딩 생성(무료·템플릿). */
export function CreateLandingButton({ query }: { query: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function create() {
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/admin/keyword-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && data?.ok) {
        setState("done");
        router.refresh();
      } else {
        setState("error");
        setMsg(data?.error === "SLUG_EXISTS" ? "이미 있음" : data?.error ?? "실패");
      }
    } catch {
      setState("error");
      setMsg("네트워크 오류");
    }
  }

  if (state === "done") {
    return <span className="text-[11px] font-bold text-emerald-600">✓ 생성됨</span>;
  }

  return (
    <button
      type="button"
      onClick={create}
      disabled={state === "loading"}
      className="rounded-md border border-gold/40 bg-gold-soft/20 px-2.5 py-1 text-[11px] font-bold text-gold-deep transition hover:bg-gold-soft/40 disabled:opacity-50"
      title="이 검색어로 /keyword 랜딩을 만듭니다"
    >
      {state === "loading" ? "생성 중…" : state === "error" ? `재시도(${msg})` : "랜딩 생성 →"}
    </button>
  );
}

/** DB 로 생성된 키워드 랜딩 삭제. */
export function DeleteLandingButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function remove() {
    if (!window.confirm(`/keyword/${slug} 랜딩을 삭제할까요?`)) return;
    setState("loading");
    try {
      await fetch(`/api/admin/keyword-landing?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
      setState("done");
      router.refresh();
    } catch {
      setState("idle");
    }
  }

  if (state === "done") return <span className="text-[11px] text-text-muted">삭제됨</span>;

  return (
    <button
      type="button"
      onClick={remove}
      disabled={state === "loading"}
      className="rounded-md border border-red-300 px-2 py-0.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
    >
      {state === "loading" ? "삭제 중…" : "삭제"}
    </button>
  );
}
