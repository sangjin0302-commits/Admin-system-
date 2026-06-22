"use client";

import { useState } from "react";

const ROLE_OPTIONS = [
  { value: "STAFF", label: "직원 (STAFF)" },
  { value: "MANAGER", label: "관리자 (MANAGER)" },
  { value: "SUPER", label: "소장 (SUPER)" },
  { value: "EXTERNAL", label: "외부협력 (EXTERNAL)" },
  { value: "AUDITOR", label: "감사 (AUDITOR)" },
];

export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("STAFF");
  const [password, setPassword] = useState("");

  async function submit() {
    setError(null);
    if (!email || !name) {
      setError("이메일과 이름은 필수입니다.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          role,
          ...(password ? { password } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "사용자 생성 실패");
        return;
      }
      setOpen(false);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="rounded bg-text-strong px-3 py-1.5 text-sm text-white"
        onClick={() => setOpen(true)}
      >
        + 사용자 추가
      </button>
    );
  }

  return (
    <div className="absolute right-4 top-16 z-20 w-80 rounded-lg border border-line bg-white p-4 shadow-lg">
      <p className="mb-2 text-sm font-semibold">새 관리자 사용자</p>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        className="mb-2 w-full rounded border border-line px-2 py-1 text-sm"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름"
        className="mb-2 w-full rounded border border-line px-2 py-1 text-sm"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="mb-2 w-full rounded border border-line bg-white px-2 py-1 text-sm"
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호 (선택, 8자 이상)"
        className="mb-2 w-full rounded border border-line px-2 py-1 text-sm"
      />
      {error && <p className="mb-2 text-xs text-rose-700">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="flex-1 rounded bg-text-strong px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {busy ? "추가중…" : "추가"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-line px-3 py-1.5 text-sm"
        >
          취소
        </button>
      </div>
    </div>
  );
}
