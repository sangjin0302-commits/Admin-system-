"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

export function EditorPermissionsClient({ initialEmails }: { initialEmails: string[] }) {
  const [emails, setEmails] = useState<string[]>(initialEmails);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(next: string[]) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/editor-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: next })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data?.error ?? "저장 실패");
        return;
      }
      setEmails(data.emails ?? next);
      setMessage("저장됨");
      setTimeout(() => setMessage(""), 1800);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function add() {
    const v = input.trim().toLowerCase();
    if (!v) return;
    if (emails.includes(v)) {
      setInput("");
      return;
    }
    const next = [...emails, v];
    setInput("");
    void save(next);
  }

  function remove(email: string) {
    if (!confirm(`${email} 편집 권한을 제거하시겠습니까?`)) return;
    const next = emails.filter((e) => e !== email);
    void save(next);
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-text-strong">편집자 이메일 ({emails.length})</h2>
      {message && <p className="mt-2 text-xs text-primary">{message}</p>}

      <div className="mt-3 flex gap-2">
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="editor@example.com"
          className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={busy || !input.trim()}
          onClick={add}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          추가
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {emails.length === 0 && (
          <li className="rounded-md border border-dashed border-line p-4 text-center text-xs text-text-muted">
            아직 편집자가 없습니다.
          </li>
        )}
        {emails.map((email) => (
          <li
            key={email}
            className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2"
          >
            <span className="text-sm text-text-strong">{email}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => remove(email)}
              className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              제거
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
