"use client";

import { useState } from "react";

type SsoProvider = "generic-oidc" | "google-workspace" | "microsoft-entra";

interface SsoConfig {
  orgId: string;
  orgName: string;
  provider: SsoProvider;
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  allowedDomains: string[];
  createdAt: string;
  active: boolean;
}

export function SsoAdminClient({ initial }: { initial: SsoConfig[] }) {
  const [configs, setConfigs] = useState<SsoConfig[]>(initial);
  const [form, setForm] = useState({
    orgId: "",
    orgName: "",
    provider: "generic-oidc" as SsoProvider,
    discoveryUrl: "",
    clientId: "",
    clientSecret: "",
    allowedDomains: "",
  });
  const [busy, setBusy] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          config: {
            ...form,
            allowedDomains: form.allowedDomains.split(",").map((s) => s.trim()).filter(Boolean),
            active: true,
          },
        }),
      });
      const json = (await res.json()) as { ok: boolean; configs?: SsoConfig[] };
      if (json.ok && json.configs) setConfigs(json.configs);
    } finally {
      setBusy(false);
    }
  }

  async function remove(orgId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", orgId }),
      });
      const json = (await res.json()) as { ok: boolean; configs?: SsoConfig[] };
      if (json.ok && json.configs) setConfigs(json.configs);
    } finally {
      setBusy(false);
    }
  }

  async function test(discoveryUrl: string) {
    setTestMsg("확인 중...");
    try {
      const res = await fetch(`/api/admin/sso?test=${encodeURIComponent(discoveryUrl)}`);
      const json = (await res.json()) as { ok: boolean; discovery?: { issuer?: string } };
      setTestMsg(json.ok ? `연결 성공 (${json.discovery?.issuer ?? "issuer 미상"})` : "연결 실패");
    } catch {
      setTestMsg("네트워크 오류");
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="font-serif text-lg font-bold text-primary">신규 조직 SSO 추가</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input placeholder="orgId (예: acme)" value={form.orgId} onChange={(e) => setForm({ ...form, orgId: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <input placeholder="조직명" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as SsoProvider })} className="rounded border border-line px-3 py-2 text-sm">
            <option value="generic-oidc">Generic OIDC</option>
            <option value="google-workspace">Google Workspace</option>
            <option value="microsoft-entra">Microsoft Entra</option>
          </select>
          <input placeholder="허용 도메인 (쉼표로 구분)" value={form.allowedDomains} onChange={(e) => setForm({ ...form, allowedDomains: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <input placeholder="OIDC Discovery URL" value={form.discoveryUrl} onChange={(e) => setForm({ ...form, discoveryUrl: e.target.value })} className="rounded border border-line px-3 py-2 text-sm md:col-span-2" />
          <input placeholder="Client ID" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <input placeholder="Client Secret" type="password" value={form.clientSecret} onChange={(e) => setForm({ ...form, clientSecret: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={busy || !form.orgId || !form.discoveryUrl} onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">저장</button>
          <button type="button" disabled={!form.discoveryUrl} onClick={() => test(form.discoveryUrl)} className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary disabled:opacity-50">연결 테스트</button>
          {testMsg && <span className="self-center text-xs text-text-muted">{testMsg}</span>}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="font-serif text-lg font-bold text-primary">설정된 조직</h2>
        {configs.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">아직 없음</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="p-2">Org</th>
                  <th className="p-2">Provider</th>
                  <th className="p-2">Domains</th>
                  <th className="p-2">Active</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {configs.map((c) => (
                  <tr key={c.orgId} className="border-b border-line/50">
                    <td className="p-2">{c.orgName} <span className="text-xs text-text-muted">({c.orgId})</span></td>
                    <td className="p-2">{c.provider}</td>
                    <td className="p-2">{c.allowedDomains.join(", ")}</td>
                    <td className="p-2">{c.active ? "✓" : "-"}</td>
                    <td className="p-2 text-right">
                      <button type="button" disabled={busy} onClick={() => test(c.discoveryUrl)} className="mr-2 text-xs text-primary underline">테스트</button>
                      <button type="button" disabled={busy} onClick={() => remove(c.orgId)} className="text-xs text-red-500 underline">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
