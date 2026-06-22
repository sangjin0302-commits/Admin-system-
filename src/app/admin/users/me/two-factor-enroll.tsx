"use client";

import { useEffect, useState } from "react";

export function TwoFactorEnroll() {
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users/me")
      .then((r) => r.json())
      .then((d) => setEnabled(!!d?.user?.twoFactorEnabled));
  }, []);

  async function startEnroll() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/2fa/enroll");
      const data = await res.json();
      if (res.ok) {
        setSecret(data.secret);
        setOtpauthUri(data.otpauthUri);
      } else {
        setMsg(data.error ?? "발급 실패");
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!secret) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/2fa/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, code }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnabled(true);
        setSecret(null);
        setOtpauthUri(null);
        setCode("");
        setMsg("2FA 활성화됨");
      } else {
        setMsg(data.error ?? "코드 검증 실패");
      }
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!confirm) return;
    if (!window.confirm("2FA를 비활성화 하시겠어요?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/2fa/enroll", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setEnabled(false);
        setMsg("2FA 비활성화됨");
      } else {
        setMsg(data.error ?? "비활성화 실패");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-text-muted">2단계 인증 (TOTP)</p>
          <h3 className="text-sm font-semibold text-text-strong">
            Google Authenticator / 1Password / Authy 등
          </h3>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            enabled
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {enabled ? "활성" : "비활성"}
        </span>
      </div>

      {!enabled && !secret && (
        <button
          type="button"
          onClick={startEnroll}
          disabled={busy}
          className="rounded bg-text-strong px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          2FA 등록 시작
        </button>
      )}

      {!enabled && secret && otpauthUri && (
        <div className="space-y-3 rounded-md border border-line bg-surface-muted p-4">
          <p className="text-sm">
            1) 인증앱에서 아래 URI를 등록(QR 스캐너 앱에 붙여넣기 또는 수동 시크릿
            입력):
          </p>
          <code className="block break-all rounded bg-white px-2 py-1.5 font-mono text-xs">
            {otpauthUri}
          </code>
          <p className="text-xs text-text-muted">
            (수동 입력 시 시크릿: <span className="font-mono">{secret}</span>)
          </p>
          <p className="text-sm">2) 인증앱이 표시하는 6자리 코드를 입력:</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              className="w-32 rounded border border-line bg-white px-2 py-1.5 text-center font-mono text-base"
            />
            <button
              type="button"
              onClick={confirm}
              disabled={busy || code.length !== 6}
              className="rounded bg-text-strong px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              확인 + 활성화
            </button>
          </div>
        </div>
      )}

      {enabled && (
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className="rounded border border-rose-300 px-3 py-1.5 text-sm text-rose-700"
        >
          2FA 비활성화
        </button>
      )}

      {msg && <p className="mt-3 text-sm text-text-muted">{msg}</p>}
    </div>
  );
}
