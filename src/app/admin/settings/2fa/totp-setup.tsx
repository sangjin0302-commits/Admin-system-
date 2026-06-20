"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TotpSetup({ email: initialEmail }: { email?: string }) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndSave() {
    if (!secret) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/2fa/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, secret, token }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("2FA가 활성화되었습니다.");
      } else {
        setStatus(data.error ?? "검증 실패");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-strong">관리자 이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          placeholder="admin@example.com"
        />
      </div>
      <Button onClick={generate} disabled={loading || !email}>
        시크릿 생성
      </Button>

      {secret && otpauthUrl && (
        <div className="space-y-3 rounded-md border border-line p-4">
          <div>
            <p className="text-xs uppercase text-text-muted">Secret (Base32)</p>
            <code className="text-sm break-all">{secret}</code>
          </div>
          <div>
            <p className="text-xs uppercase text-text-muted">otpauth URL</p>
            <code className="text-xs break-all">{otpauthUrl}</code>
          </div>
          <p className="text-xs text-text-muted">
            인증 앱(Google Authenticator, 1Password 등)에 위 URL 또는 시크릿을 수동 등록한 뒤 6자리
            코드를 입력하세요.
          </p>
          <div className="flex gap-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-32 rounded-md border border-line bg-surface px-3 py-2 text-sm"
            />
            <Button onClick={verifyAndSave} disabled={loading || token.length !== 6}>
              검증 및 저장
            </Button>
          </div>
        </div>
      )}

      {status && <p className="text-sm">{status}</p>}
    </Card>
  );
}
