"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { CrmConfig, CrmLogEntry } from "@/lib/services/crm-integration-service";

type SafeConfig = CrmConfig; // masked

export function CrmClient({
  initialConfig,
  initialHistory,
}: {
  initialConfig: SafeConfig;
  initialHistory: CrmLogEntry[];
}) {
  const [provider, setProvider] = useState(initialConfig.provider);
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [hubspotKey, setHubspotKey] = useState("");
  const [sfUrl, setSfUrl] = useState(initialConfig.salesforce.instanceUrl);
  const [sfToken, setSfToken] = useState("");
  const [entity, setEntity] = useState<"inquiry" | "case">("inquiry");
  const [entityId, setEntityId] = useState("");
  const [history, setHistory] = useState<CrmLogEntry[]>(initialHistory);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function call(body: unknown) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/integrations/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      setMessage(j.ok ? `성공 ${j.count != null ? `(${j.count}건)` : ""}${j.externalId ? ` · ${j.externalId}` : ""}` : `실패: ${j.error ?? "unknown"}`);
      const g = await fetch("/api/admin/integrations/crm");
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
          <label><input type="radio" checked={provider === "hubspot"} onChange={() => setProvider("hubspot")} /> HubSpot</label>
          <label><input type="radio" checked={provider === "salesforce"} onChange={() => setProvider("salesforce")} /> Salesforce</label>
          <label className="ml-auto flex items-center gap-2">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> 활성화
          </label>
        </div>
        {provider === "hubspot" ? (
          <div className="mt-3">
            <input className="w-full rounded-lg border border-line px-3 py-2 text-sm" type="password" placeholder={initialConfig.hubspot.apiKey || "HubSpot API Key"} value={hubspotKey} onChange={(e) => setHubspotKey(e.target.value)} />
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Instance URL" value={sfUrl} onChange={(e) => setSfUrl(e.target.value)} />
            <input className="rounded-lg border border-line px-3 py-2 text-sm" type="password" placeholder={initialConfig.salesforce.token || "Token"} value={sfToken} onChange={(e) => setSfToken(e.target.value)} />
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button disabled={busy} onClick={() => call({ action: "save", provider, enabled, hubspot: { apiKey: hubspotKey || undefined }, salesforce: { instanceUrl: sfUrl || undefined, token: sfToken || undefined } })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            저장
          </button>
          <button disabled={busy} onClick={() => call({ action: "test" })} className="rounded-lg border border-line px-4 py-2 text-sm">
            연결 테스트
          </button>
          <button disabled={busy} onClick={() => call({ action: "full_sync" })} className="rounded-lg border border-line px-4 py-2 text-sm">
            전체 동기화
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">개별 동기화</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={entity} onChange={(e) => setEntity(e.target.value as "inquiry" | "case")}>
            <option value="inquiry">문의 → Contact</option>
            <option value="case">사건 → Deal</option>
          </select>
          <input className="rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" placeholder="ID" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
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
                  <span className="text-xs uppercase text-primary">{h.action}</span> {h.provider} · {h.entity}
                  {h.entityId ? `:${h.entityId}` : ""}
                </span>
                <span className={h.ok ? "text-xs text-success" : "text-xs text-warning"}>
                  {h.ok ? `OK ${h.externalId ?? ""}` : h.error ?? "ERR"} · {new Date(h.ts).toLocaleString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
