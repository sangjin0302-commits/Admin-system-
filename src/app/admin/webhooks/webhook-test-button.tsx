"use client";

import { useCallback, useState } from "react";

type Result = { success: boolean; slack: boolean; telegram: boolean } | null;

export function WebhookTestButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const handleTest = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/webhooks/test", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, slack: false, telegram: false });
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleTest}
        disabled={disabled || loading}
        className="ui-cta-pill-primary"
      >
        {loading ? "전송 중..." : "테스트 알림 보내기"}
      </button>

      {result && (
        <span className="text-sm text-text-muted">
          {result.success
            ? `전송 완료 — Slack: ${result.slack ? "✓" : "✗"} · Telegram: ${result.telegram ? "✓" : "✗"}`
            : "전송 실패 — 환경변수를 확인해 주세요."}
        </span>
      )}
    </div>
  );
}
