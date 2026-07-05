"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { WorkspaceConfig, WorkspaceLogEntry, WorkspaceUser } from "@/lib/services/google-workspace-service";

export function GoogleWorkspaceClient({
  initialConfig,
  initialHistory,
}: {
  initialConfig: WorkspaceConfig;
  initialHistory: WorkspaceLogEntry[];
}) {
  const [adminEmail, setAdminEmail] = useState(initialConfig.adminEmail);
  const [domain, setDomain] = useState(initialConfig.defaultDomain);
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [history, setHistory] = useState<WorkspaceLogEntry[]>(initialHistory);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refreshHistory() {
    const g = await fetch("/api/admin/integrations/google-workspace");
    const gj = await g.json();
    if (gj.ok) setHistory(gj.history);
  }

  async function call(body: unknown) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/integrations/google-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (j.ok) {
        if (j.users) setUsers(j.users);
        if (j.tempPassword) setMessage(`생성 완료. 임시 비밀번호: ${j.tempPassword}`);
        else setMessage("성공");
      } else {
        setMessage(`실패: ${j.error ?? "unknown"}`);
      }
      await refreshHistory();
      return j;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">설정</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Admin Email (impersonate)" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Default Domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> 활성화
        </label>
        <div className="mt-3 flex gap-2">
          <button disabled={busy} onClick={() => call({ action: "save", adminEmail, defaultDomain: domain, enabled })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            저장
          </button>
          <button disabled={busy} onClick={() => call({ action: "test" })} className="rounded-lg border border-line px-4 py-2 text-sm">
            연결 테스트
          </button>
          <button disabled={busy} onClick={() => call({ action: "list" })} className="rounded-lg border border-line px-4 py-2 text-sm">
            사용자 목록 불러오기
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">새 계정</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="이름 (given)" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="성 (family)" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="primary@example.com" value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} />
        </div>
        <button
          disabled={busy || !firstName || !lastName || !primaryEmail}
          onClick={() => call({ action: "create", firstName, lastName, primaryEmail })}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          생성
        </button>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">사용자 목록</h3>
        {users.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">불러오기 버튼을 누르면 목록이 표시됩니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {users.map((u) => (
              <li key={u.primaryEmail} className="flex items-center justify-between py-2">
                <span>
                  {u.name?.familyName ?? ""} {u.name?.givenName ?? ""} — {u.primaryEmail}
                  {u.suspended && <span className="ml-2 text-xs text-warning">(중지)</span>}
                </span>
                <div className="flex gap-2">
                  {u.suspended ? (
                    <button disabled={busy} onClick={() => call({ action: "reactivate", email: u.primaryEmail })} className="rounded border border-line px-2 py-1 text-xs">
                      재활성화
                    </button>
                  ) : (
                    <button disabled={busy} onClick={() => call({ action: "suspend", email: u.primaryEmail })} className="rounded border border-line px-2 py-1 text-xs text-warning">
                      중지
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
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
                  <span className="text-xs uppercase text-primary">{h.action}</span> {h.target ?? ""}
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
