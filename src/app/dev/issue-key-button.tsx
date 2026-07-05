"use client";

import { useState } from "react";

export function IssueKeyButton({ productId, isLoggedIn }: { productId: string; isLoggedIn: boolean }) {
  const [state, setState] = useState<{ secret?: string; error?: string; busy: boolean }>({ busy: false });

  async function issue() {
    setState({ busy: true });
    const res = await fetch("/api/dev/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j?.ok) setState({ secret: j.secret, busy: false });
    else setState({ error: j?.error ?? "FAILED", busy: false });
  }

  if (!isLoggedIn) {
    return <button disabled className="rounded border border-line px-3 py-1.5 text-xs text-text-muted">로그인 필요</button>;
  }
  if (state.secret) {
    return (
      <div className="rounded border border-primary bg-primary/5 p-3">
        <p className="text-xs font-bold text-primary">발급된 API 키 (이 창을 닫으면 다시 볼 수 없습니다)</p>
        <code className="mt-1 block break-all rounded bg-white p-2 text-xs">{state.secret}</code>
      </div>
    );
  }
  return (
    <button
      onClick={issue}
      disabled={state.busy}
      className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
    >
      {state.busy ? "발급 중..." : "API 키 발급"}
      {state.error && <span className="ml-2 text-red-200">{state.error}</span>}
    </button>
  );
}
