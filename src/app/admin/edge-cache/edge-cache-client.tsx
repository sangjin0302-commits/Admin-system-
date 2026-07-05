"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function EdgeCacheClient() {
  const [busy, setBusy] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  async function revalidateAll() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/edge-cache", { method: "POST", cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; count?: number; error?: string };
      if (!res.ok || data.ok === false) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMsg(`${data.count ?? 0}개 경로 재검증 완료`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "요청 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={revalidateAll} disabled={busy}>
        전체 재검증
      </Button>
      {msg && <span className="text-xs text-text-muted">{msg}</span>}
    </div>
  );
}
