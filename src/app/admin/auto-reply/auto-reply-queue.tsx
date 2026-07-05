"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AutoReplyConfig, PendingAutoReply } from "@/lib/services/ai-auto-reply-service";

type Props = {
  initialQueue: PendingAutoReply[];
  initialConfig: AutoReplyConfig;
};

export function AutoReplyQueue({ initialQueue, initialConfig }: Props) {
  const [queue, setQueue] = useState<PendingAutoReply[]>(initialQueue);
  const [config, setConfig] = useState<AutoReplyConfig>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function act(action: "approve" | "reject", inquiryId: string) {
    setLoading(true);
    try {
      await fetch("/api/admin/auto-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, inquiryId })
      });
      setQueue((prev) => prev.filter((q) => q.inquiryId !== inquiryId));
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setLoading(true);
    try {
      await fetch("/api/admin/auto-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "config", config })
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-semibold">설정</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            최소 확신도 ({config.minConfidence.toFixed(2)})
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.minConfidence}
              onChange={(e) => setConfig({ ...config, minConfidence: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <label className="text-sm">
            자동 발송 임계 ({config.autoSendThreshold.toFixed(2)})
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.autoSendThreshold}
              onChange={(e) => setConfig({ ...config, autoSendThreshold: Number(e.target.value) })}
              className="w-full"
            />
          </label>
        </div>
        <label className="block text-sm">
          허용 카테고리 (쉼표 구분, 비우면 전체)
          <input
            className="mt-1 w-full rounded border border-line px-2 py-1"
            value={config.categories.join(",")}
            onChange={(e) =>
              setConfig({
                ...config,
                categories: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              })
            }
          />
        </label>
        <Button onClick={saveConfig} disabled={loading}>
          설정 저장
        </Button>
      </Card>

      <Card className="p-6 space-y-3">
        <h3 className="text-base font-semibold">승인 대기 ({queue.length})</h3>
        {queue.length === 0 ? (
          <p className="text-sm text-text-muted">대기 중인 초안이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {queue.map((q) => (
              <li key={q.inquiryId} className="rounded-md border border-line p-3">
                <p className="text-xs text-text-muted">
                  {q.inquiryId} · 확신도 {(q.confidence * 100).toFixed(0)}%
                </p>
                <textarea
                  className="mt-2 w-full min-h-[120px] rounded border border-line p-2 text-sm"
                  value={drafts[q.inquiryId] ?? q.draft}
                  onChange={(e) => setDrafts({ ...drafts, [q.inquiryId]: e.target.value })}
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => act("approve", q.inquiryId)} disabled={loading}>
                    승인 발송
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => act("approve", q.inquiryId)} disabled={loading}>
                    수정 후 발송
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => act("reject", q.inquiryId)} disabled={loading}>
                    거부
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
