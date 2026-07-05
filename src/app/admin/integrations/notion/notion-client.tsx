"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { NotionConfig, NotionSyncLogEntry } from "@/lib/services/notion-integration-service";

type SafeConfig = Omit<NotionConfig, "apiToken"> & { apiToken: string };

export function NotionClient({
  initialConfig,
  initialHistory,
}: {
  initialConfig: SafeConfig;
  initialHistory: NotionSyncLogEntry[];
}) {
  const [databaseId, setDatabaseId] = useState(initialConfig.databaseId);
  const [apiToken, setApiToken] = useState("");
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [entity, setEntity] = useState<"inquiry" | "case">("case");
  const [entityId, setEntityId] = useState("");
  const [history, setHistory] = useState<NotionSyncLogEntry[]>(initialHistory);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function call(body: unknown, refreshHistory = true) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setMessage(json.ok ? "성공" : `실패: ${json.error ?? "unknown"}`);
      if (refreshHistory) {
        const g = await fetch("/api/admin/integrations/notion");
        const gj = await g.json();
        if (gj.ok) setHistory(gj.history);
      }
      return json;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">설정</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            API 토큰 (저장 시 새 값)
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
              placeholder={initialConfig.apiToken || "secret_..."}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Database ID
            <input
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          연동 활성화
        </label>
        <div className="mt-3 flex gap-2">
          <button
            disabled={busy}
            onClick={() =>
              call({
                action: "save",
                apiToken: apiToken || undefined,
                databaseId,
                enabled,
              })
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            저장
          </button>
          <button
            disabled={busy}
            onClick={() => call({ action: "test" }, false)}
            className="rounded-lg border border-line px-4 py-2 text-sm"
          >
            연결 테스트
          </button>
          <button
            disabled={busy}
            onClick={() => call({ action: "poll" })}
            className="rounded-lg border border-line px-4 py-2 text-sm"
          >
            Notion 편집 폴링
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">수동 동기화</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <select
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={entity}
            onChange={(e) => setEntity(e.target.value as "inquiry" | "case")}
          >
            <option value="case">사건 (case)</option>
            <option value="inquiry">문의 (inquiry)</option>
          </select>
          <input
            className="rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2"
            placeholder="ID"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
          />
        </div>
        <button
          disabled={busy || !entityId}
          onClick={() => call({ action: "sync", entity, id: entityId })}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          동기화
        </button>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">이력</h3>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {history.slice(0, 50).map((h, i) => (
              <li key={i} className="flex justify-between py-2">
                <span>
                  <span className="text-xs uppercase text-primary">{h.action}</span> {h.entity}:{h.entityId}
                </span>
                <span className={h.ok ? "text-xs text-success" : "text-xs text-warning"}>
                  {h.ok ? "OK" : h.error ?? "ERR"} · {new Date(h.ts).toLocaleString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
