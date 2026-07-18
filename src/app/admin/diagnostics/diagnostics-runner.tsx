"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DiagnosticsRunner() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/integration-diagnostics", { method: "POST" });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (err) {
      setError(String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card className="p-5">
      <p className="ui-kicker">텔레그램 실제 발송 테스트</p>
      <p className="mt-2 text-sm text-text-muted">
        버튼을 누르면 서버에서 Telegram API를 직접 호출합니다. 텔레그램에 메시지 2건(평문 1 + 서식 1)이
        도착해야 정상이며, 실패 시 아래에 Telegram이 반환한 원본 오류가 표시됩니다.
      </p>
      <div className="mt-4">
        <Button type="button" onClick={run} disabled={running}>
          {running ? "발송 중…" : "테스트 발송"}
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 font-mono text-xs text-red-700">{error}</p>
      )}

      {result && (
        <pre className="mt-4 max-h-[480px] overflow-auto rounded-lg bg-surface-muted p-4 font-mono text-[11px] leading-5 text-text">
          {result}
        </pre>
      )}

      <div className="mt-5 border-t border-line/70 pt-4 text-xs leading-6 text-text-muted">
        <p className="font-bold text-text">자주 나오는 Telegram 오류</p>
        <p>
          <code>chat not found</code> — chat id가 틀렸거나, 해당 봇과 대화를 시작(/start)하지 않음
        </p>
        <p>
          <code>bot was blocked by the user</code> — 봇을 차단함. 차단 해제 필요
        </p>
        <p>
          <code>Unauthorized</code> — 봇 토큰이 틀림
        </p>
        <p>
          <code>can&apos;t parse entities</code> — 서식 오류. 평문은 가되 서식만 실패하는 경우
        </p>
      </div>
    </Card>
  );
}
