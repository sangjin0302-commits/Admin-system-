"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { WebhookSubscription, ZapierEvent, ZapierLogEntry } from "@/lib/services/zapier-webhook-service";

export function ZapierClient({
  initialSubs,
  initialHistory,
  events,
}: {
  initialSubs: WebhookSubscription[];
  initialHistory: ZapierLogEntry[];
  events: ZapierEvent[];
}) {
  const [subs, setSubs] = useState<WebhookSubscription[]>(initialSubs);
  const [history, setHistory] = useState<ZapierLogEntry[]>(initialHistory);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<ZapierEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/integrations/zapier");
    const j = await res.json();
    if (j.ok) {
      setSubs(j.subscriptions);
      setHistory(j.history);
    }
  }

  async function call(body: unknown, reload = true) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/integrations/zapier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      setMessage(j.ok ? "성공" : `실패: ${j.error ?? "unknown"}`);
      if (reload) await refresh();
    } finally {
      setBusy(false);
    }
  }

  function toggleEvent(e: ZapierEvent) {
    setSelectedEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }

  function submitNew() {
    if (!url || !secret || selectedEvents.length === 0) {
      setMessage("URL / 시크릿 / 이벤트를 모두 지정하세요");
      return;
    }
    const id = `sub_${Date.now().toString(36)}`;
    call({ action: "upsert", id, url, secret, events: selectedEvents, active: true });
    setUrl("");
    setSecret("");
    setSelectedEvents([]);
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">새 구독 추가</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Webhook URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Secret (헤더 검증용)" value={secret} onChange={(e) => setSecret(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {events.map((e) => (
            <label key={e} className="flex items-center gap-1">
              <input type="checkbox" checked={selectedEvents.includes(e)} onChange={() => toggleEvent(e)} />
              {e}
            </label>
          ))}
        </div>
        <button disabled={busy} onClick={submitNew} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          추가
        </button>
        {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">구독 목록</h3>
        {subs.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">구독이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {subs.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">{s.url}</div>
                  <div className="text-xs text-text-muted">
                    {s.events.join(", ")} · {s.active ? "활성" : "비활성"} · {s.id}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => call({ action: "test", id: s.id })} className="rounded border border-line px-2 py-1 text-xs">
                    테스트
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => call({ action: "upsert", ...s, active: !s.active })}
                    className="rounded border border-line px-2 py-1 text-xs"
                  >
                    {s.active ? "비활성화" : "활성화"}
                  </button>
                  <button disabled={busy} onClick={() => call({ action: "delete", id: s.id })} className="rounded border border-line px-2 py-1 text-xs text-warning">
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">발송 이력</h3>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {history.slice(0, 50).map((h, i) => (
              <li key={i} className="flex justify-between py-2">
                <span>
                  <span className="text-xs uppercase text-primary">{h.event}</span> · {h.subscriptionId}
                </span>
                <span className={h.ok ? "text-xs text-success" : "text-xs text-warning"}>
                  {h.status ?? "-"} {h.error ?? ""} · {new Date(h.ts).toLocaleString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
