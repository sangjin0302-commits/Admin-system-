"use client";

import { useState } from "react";

type Sub = { email: string; subscribedAt: string; categories?: string[] };

export function NewsletterAdminPanel({ subscribers }: { subscribers: Sub[] }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [list, setList] = useState<Sub[]>(subscribers);

  async function sendTest() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/newsletter/test-digest", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setMsg(`테스트 발송 완료 (posts: ${data.posts ?? 0}, subscribers: ${data.recipients ?? 0}).`);
      } else {
        setMsg(data.error ?? "발송 실패");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(email: string) {
    if (!confirm(`${email} 구독을 해제하시겠습니까?`)) return;
    const res = await fetch("/api/admin/newsletter/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setList((prev) => prev.filter((s) => s.email !== email));
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={sendTest}
          disabled={busy}
          className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "발송 중…" : "테스트 다이제스트 발송"}
        </button>
        {msg && <span className="text-xs text-text-muted">{msg}</span>}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-text-strong">구독자 목록</h3>
        {list.length === 0 ? (
          <p className="mt-3 text-xs text-text-muted">구독자가 없습니다.</p>
        ) : (
          <div className="mt-3 overflow-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-white/60 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">이메일</th>
                  <th className="px-3 py-2 font-semibold">가입일</th>
                  <th className="px-3 py-2 font-semibold">관심 카테고리</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.email} className="border-t border-line">
                    <td className="px-3 py-2 font-mono">{s.email}</td>
                    <td className="px-3 py-2 text-text-muted">{s.subscribedAt.slice(0, 10)}</td>
                    <td className="px-3 py-2 text-text-muted">
                      {s.categories && s.categories.length > 0 ? s.categories.join(", ") : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => remove(s.email)}
                        className="text-red-600 hover:underline"
                      >
                        해제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
