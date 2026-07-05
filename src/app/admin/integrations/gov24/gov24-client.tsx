"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { Gov24Request, Gov24DocCode } from "@/lib/services/gov24-types";
import { getStandardRequestTemplate } from "@/lib/services/gov24-types";

type DocDef = { code: Gov24DocCode; label: string };

export function Gov24Client({
  initialRequests,
  docTypes,
}: {
  initialRequests: Gov24Request[];
  docTypes: DocDef[];
}) {
  const [reqs, setReqs] = useState<Gov24Request[]>(initialRequests);
  const [type, setType] = useState<Gov24DocCode>(docTypes[0].code);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/integrations/gov24", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          type,
          ownerConsent: true,
          requesterName: name,
          note,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage(json.instructions ?? "요청되었습니다");
        // reload list
        const g = await fetch("/api/admin/integrations/gov24");
        const gj = await g.json();
        if (gj.ok) setReqs(gj.requests as Gov24Request[]);
      } else {
        setMessage(json.error ?? "실패");
      }
    } finally {
      setBusy(false);
    }
  }

  function copyTemplate() {
    const t = getStandardRequestTemplate(type, name);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(t).then(() => setMessage("템플릿이 클립보드에 복사되었습니다"));
    }
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">서류 요청</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <select
            className="rounded-lg border border-line px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as Gov24DocCode)}
          >
            {docTypes.map((d) => (
              <option key={d.code} value={d.code}>{d.label}</option>
            ))}
          </select>
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="요청자 성명" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="비고" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={submit} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            요청 등록
          </button>
          <button onClick={copyTemplate} className="rounded-lg border border-line px-4 py-2 text-sm">
            표준 요청 템플릿 복사
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">요청 큐</h3>
        {reqs.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">요청 이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {reqs.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium text-text-strong">{r.docLabel}</div>
                  <div className="text-xs text-text-muted">
                    {r.requesterName ?? "-"} · {new Date(r.requestedAt).toLocaleString("ko-KR")}
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase text-primary">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
