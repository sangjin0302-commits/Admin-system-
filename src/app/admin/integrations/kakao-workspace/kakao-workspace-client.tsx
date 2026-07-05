"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { BotInteraction } from "@/lib/services/kakao-workspace-bot";

export function KakaoWorkspaceClient({ initialInteractions }: { initialInteractions: BotInteraction[] }) {
  const [interactions, setInteractions] = useState<BotInteraction[]>(initialInteractions);
  const [text, setText] = useState("/오늘");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/integrations/kakao-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (json.ok) {
        setReply(json.response as string);
        const g = await fetch("/api/admin/integrations/kakao-workspace");
        const gj = await g.json();
        if (gj.ok) setInteractions(gj.interactions as BotInteraction[]);
      } else {
        setReply(json.error ?? "실패");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">테스트 명령 실행</h3>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm font-mono"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="/오늘"
          />
          <button onClick={run} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            실행
          </button>
        </div>
        {reply && (
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-surface-muted p-3 text-sm">{reply}</pre>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">최근 봇 대화</h3>
        {interactions.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">기록이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {interactions.map((i) => (
              <li key={i.id} className="py-2 text-sm">
                <div className="text-xs text-text-muted">
                  {new Date(i.at).toLocaleString("ko-KR")} · {i.sender ?? "-"} · {i.command}
                </div>
                <div className="mt-1 font-mono">{i.inputText}</div>
                <div className="mt-1 text-text-muted">{i.response}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
