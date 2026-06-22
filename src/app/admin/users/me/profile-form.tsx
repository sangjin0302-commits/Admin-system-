"use client";

import { useEffect, useState } from "react";

type User = {
  email: string;
  name: string;
  role: string;
  lastLoginAt: string | null;
  twoFactorEnabled: boolean;
};

export function ProfileForm() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setUser(d.user);
          setName(d.user.name);
        }
      });
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const body: Record<string, string> = { name };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      const res = await fetch("/api/admin/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "저장 실패");
        return;
      }
      setMsg("저장됨");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <p className="text-sm text-text-muted">불러오는 중…</p>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs text-text-muted">이메일</label>
          <input
            value={user.email}
            disabled
            className="mt-1 w-full rounded border border-line bg-surface-muted px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">역할</label>
          <input
            value={user.role}
            disabled
            className="mt-1 w-full rounded border border-line bg-surface-muted px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-line px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">마지막 로그인</label>
          <input
            value={
              user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString("ko-KR")
                : "—"
            }
            disabled
            className="mt-1 w-full rounded border border-line bg-surface-muted px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs text-text-muted">현재 비밀번호</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded border border-line px-2 py-1.5 text-sm"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">새 비밀번호 (선택)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="비우면 변경 안 함"
            className="mt-1 w-full rounded border border-line px-2 py-1.5 text-sm"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded bg-text-strong px-4 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {busy ? "저장중…" : "저장"}
        </button>
        {msg && <span className="text-sm text-text-muted">{msg}</span>}
      </div>
    </div>
  );
}
