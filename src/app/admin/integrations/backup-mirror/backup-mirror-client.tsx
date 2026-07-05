"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { BackupMirrorConfig, BackupMirrorLogEntry } from "@/lib/services/backup-mirror-service";

type SafeConfig = BackupMirrorConfig; // 이미 apiKey는 마스킹됨

export function BackupMirrorClient({
  initialConfig,
  initialHistory,
}: {
  initialConfig: SafeConfig;
  initialHistory: BackupMirrorLogEntry[];
}) {
  const [provider, setProvider] = useState(initialConfig.provider);
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [airtableKey, setAirtableKey] = useState("");
  const [airtableBaseId, setAirtableBaseId] = useState(initialConfig.airtable.baseId);
  const [airtableTable, setAirtableTable] = useState(initialConfig.airtable.tableName);
  const [sheetsId, setSheetsId] = useState(initialConfig.sheets.spreadsheetId);
  const [sheetsName, setSheetsName] = useState(initialConfig.sheets.sheetName);
  const [history, setHistory] = useState<BackupMirrorLogEntry[]>(initialHistory);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function call(body: unknown) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/integrations/backup-mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setMessage(json.ok ? `성공 ${json.count != null ? `(${json.count}건)` : ""}` : `실패: ${json.error ?? "unknown"}`);
      const g = await fetch("/api/admin/integrations/backup-mirror");
      const gj = await g.json();
      if (gj.ok) setHistory(gj.history);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">Provider</h3>
        <div className="mt-3 flex gap-4 text-sm">
          <label>
            <input type="radio" checked={provider === "airtable"} onChange={() => setProvider("airtable")} /> Airtable
          </label>
          <label>
            <input type="radio" checked={provider === "sheets"} onChange={() => setProvider("sheets")} /> Google Sheets
          </label>
          <label className="ml-auto flex items-center gap-2">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> 활성화
          </label>
        </div>
        {provider === "airtable" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input className="rounded-lg border border-line px-3 py-2 text-sm" type="password" placeholder={initialConfig.airtable.apiKey || "API Key"} value={airtableKey} onChange={(e) => setAirtableKey(e.target.value)} />
            <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Base ID" value={airtableBaseId} onChange={(e) => setAirtableBaseId(e.target.value)} />
            <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Table Name" value={airtableTable} onChange={(e) => setAirtableTable(e.target.value)} />
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Spreadsheet ID" value={sheetsId} onChange={(e) => setSheetsId(e.target.value)} />
            <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Sheet Name" value={sheetsName} onChange={(e) => setSheetsName(e.target.value)} />
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button
            disabled={busy}
            onClick={() =>
              call({
                action: "save",
                provider,
                enabled,
                airtable: { apiKey: airtableKey || undefined, baseId: airtableBaseId, tableName: airtableTable },
                sheets: { spreadsheetId: sheetsId, sheetName: sheetsName },
              })
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            저장
          </button>
          <button disabled={busy} onClick={() => call({ action: "test" })} className="rounded-lg border border-line px-4 py-2 text-sm">
            테스트 미러
          </button>
          <button disabled={busy} onClick={() => call({ action: "full_sync" })} className="rounded-lg border border-line px-4 py-2 text-sm">
            전체 동기화 실행
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
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
                  <span className="text-xs uppercase text-primary">{h.action}</span> {h.provider} · {h.entity} ({h.count})
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
