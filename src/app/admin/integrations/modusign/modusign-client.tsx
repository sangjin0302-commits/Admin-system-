"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { ModusignTemplate, SignatureRequest, Signer } from "@/lib/services/modusign-integration";

export function ModusignClient({
  initialTemplates,
  initialOutbox,
}: {
  initialTemplates: ModusignTemplate[];
  initialOutbox: SignatureRequest[];
}) {
  const [templates] = useState<ModusignTemplate[]>(initialTemplates);
  const [outbox, setOutbox] = useState<SignatureRequest[]>(initialOutbox);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [caseId, setCaseId] = useState("");
  const [signers, setSigners] = useState<Signer[]>([{ email: "", name: "", role: "signer" }]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function addSigner() {
    setSigners([...signers, { email: "", name: "", role: "signer" }]);
  }

  function updateSigner(i: number, patch: Partial<Signer>) {
    setSigners(signers.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  async function send() {
    if (!templateId || signers.some((s) => !s.email || !s.name)) {
      setMessage("템플릿과 모든 서명자 정보를 입력해 주세요");
      return;
    }
    setBusy(true);
    try {
      const templateName = templates.find((t) => t.id === templateId)?.name;
      const res = await fetch("/api/admin/integrations/modusign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          caseId: caseId || undefined,
          templateId,
          templateName,
          signers,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setOutbox([json.request as SignatureRequest, ...outbox]);
        setMessage(json.request.dryRun ? "dry-run 발송 완료" : "발송 완료");
      } else {
        setMessage(json.error ?? "실패");
      }
    } finally {
      setBusy(false);
    }
  }

  async function poll(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/integrations/modusign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "poll", requestId: id }),
      });
      const json = await res.json();
      if (json.ok && json.request) {
        setOutbox((prev) => prev.map((v) => (v.id === id ? json.request as SignatureRequest : v)));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">템플릿</h3>
        {templates.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">템플릿이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {templates.map((t) => (
              <li key={t.id} className="flex justify-between">
                <span>{t.name}</span>
                <span className="text-xs text-text-muted">{t.id}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">서명 요청 발송</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">템플릿 선택</option>
            {templates.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
          <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="사건 ID (선택)" value={caseId} onChange={(e) => setCaseId(e.target.value)} />
        </div>
        <div className="mt-3 space-y-2">
          {signers.map((s, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-3">
              <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="이름" value={s.name} onChange={(e) => updateSigner(i, { name: e.target.value })} />
              <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="이메일" value={s.email} onChange={(e) => updateSigner(i, { email: e.target.value })} />
              <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="역할 (예: 의뢰인)" value={s.role ?? ""} onChange={(e) => updateSigner(i, { role: e.target.value })} />
            </div>
          ))}
          <button onClick={addSigner} className="text-xs text-primary underline">+ 서명자 추가</button>
        </div>
        <button onClick={send} disabled={busy} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          발송
        </button>
        {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">발송 이력</h3>
        {outbox.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">발송된 요청이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {outbox.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">{r.templateName ?? r.templateId}</div>
                  <div className="text-xs text-text-muted">
                    서명자: {r.signers.map((s) => s.name).join(", ")} · {new Date(r.createdAt).toLocaleString("ko-KR")}
                    {r.dryRun && " · dry-run"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-primary">{r.status}</span>
                  <button onClick={() => poll(r.id)} disabled={busy} className="rounded border border-line px-2 py-1 text-xs">
                    상태 조회
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
