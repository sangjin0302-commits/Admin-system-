"use client";

import { useState } from "react";
import type {
  CaseHandoffEntry,
  CaseShareEntry,
  NetworkPeer,
} from "@/lib/services/admin-network-service";

interface Props {
  initialPeers: NetworkPeer[];
  initialShares: CaseShareEntry[];
  initialHandoffs: CaseHandoffEntry[];
}

export function AdminNetworkClient({ initialPeers, initialShares, initialHandoffs }: Props) {
  const [peers, setPeers] = useState<NetworkPeer[]>(initialPeers);
  const [shares, setShares] = useState<CaseShareEntry[]>(initialShares);
  const [handoffs, setHandoffs] = useState<CaseHandoffEntry[]>(initialHandoffs);
  const [busy, setBusy] = useState(false);
  const [shareForm, setShareForm] = useState({ caseId: "", peerId: "", message: "" });
  const [handoffForm, setHandoffForm] = useState({ caseId: "", peerId: "", splitPct: 50, note: "" });

  async function refresh() {
    const res = await fetch("/api/admin/network");
    const j = await res.json();
    if (j.ok) {
      setPeers(j.peers);
      setShares(j.shares);
      setHandoffs(j.handoffs);
    }
  }

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch("/api/admin/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const verified = peers.filter((p) => p.verified);

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-base font-bold">네트워크 파트너 ({peers.length})</h3>
        <p className="mt-1 text-xs text-text-muted">
          공개 신청 링크: <code className="rounded bg-surface-muted px-1">/network</code>
        </p>
        <ul className="mt-3 space-y-2">
          {peers.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
              <div>
                <p className="text-sm font-semibold">
                  {p.name} · {p.firm}
                  {p.verified ? (
                    <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">인증</span>
                  ) : (
                    <span className="ml-2 rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-700">대기</span>
                  )}
                </p>
                <p className="text-xs text-text-muted">
                  {p.contactEmail} · 전문: {p.specialties.join(", ") || "-"}
                </p>
              </div>
              <div className="flex gap-2">
                {!p.verified && (
                  <button type="button" disabled={busy}
                    onClick={() => post({ action: "verify-peer", peerId: p.id })}
                    className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-white">
                    인증
                  </button>
                )}
                <button type="button" disabled={busy}
                  onClick={() => post({ action: "remove-peer", peerId: p.id })}
                  className="rounded border border-line px-3 py-1.5 text-xs">
                  삭제
                </button>
              </div>
            </li>
          ))}
          {peers.length === 0 && (
            <li className="py-6 text-center text-sm text-text-muted">아직 등록된 파트너가 없습니다.</li>
          )}
        </ul>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form
          onSubmit={(e) => { e.preventDefault(); void post({ action: "share", ...shareForm }); }}
          className="space-y-2 rounded-lg border border-line p-4"
        >
          <h4 className="text-sm font-bold">사건 공유</h4>
          <input required placeholder="사건 ID" value={shareForm.caseId}
            onChange={(e) => setShareForm({ ...shareForm, caseId: e.target.value })}
            className="h-9 w-full rounded border border-line px-3 text-sm" />
          <select required value={shareForm.peerId}
            onChange={(e) => setShareForm({ ...shareForm, peerId: e.target.value })}
            className="h-9 w-full rounded border border-line px-3 text-sm">
            <option value="">파트너 선택</option>
            {verified.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.firm})</option>)}
          </select>
          <textarea placeholder="메시지" value={shareForm.message}
            onChange={(e) => setShareForm({ ...shareForm, message: e.target.value })}
            className="min-h-[60px] w-full rounded border border-line p-2 text-sm" />
          <button type="submit" disabled={busy} className="w-full rounded bg-primary px-3 py-2 text-sm font-bold text-white">
            공유 전송
          </button>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void post({
              action: "handoff",
              caseId: handoffForm.caseId,
              peerId: handoffForm.peerId,
              splitPct: handoffForm.splitPct,
              message: handoffForm.note,
            });
          }}
          className="space-y-2 rounded-lg border border-line p-4"
        >
          <h4 className="text-sm font-bold">사건 재배정 (Handoff)</h4>
          <input required placeholder="사건 ID" value={handoffForm.caseId}
            onChange={(e) => setHandoffForm({ ...handoffForm, caseId: e.target.value })}
            className="h-9 w-full rounded border border-line px-3 text-sm" />
          <select required value={handoffForm.peerId}
            onChange={(e) => setHandoffForm({ ...handoffForm, peerId: e.target.value })}
            className="h-9 w-full rounded border border-line px-3 text-sm">
            <option value="">파트너 선택</option>
            {verified.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label className="block text-xs text-text-muted">
            원 소유자 몫 {handoffForm.splitPct}% / 파트너 {100 - handoffForm.splitPct}%
            <input type="range" min={0} max={100} value={handoffForm.splitPct}
              onChange={(e) => setHandoffForm({ ...handoffForm, splitPct: Number(e.target.value) })}
              className="mt-1 w-full" />
          </label>
          <input placeholder="메모" value={handoffForm.note}
            onChange={(e) => setHandoffForm({ ...handoffForm, note: e.target.value })}
            className="h-9 w-full rounded border border-line px-3 text-sm" />
          <button type="submit" disabled={busy} className="w-full rounded bg-primary px-3 py-2 text-sm font-bold text-white">
            재배정 제안
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-base font-bold">공유 이력 ({shares.length})</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {shares.slice(-10).reverse().map((s) => (
            <li key={s.id} className="rounded border border-line px-3 py-1.5">
              {new Date(s.createdAt).toLocaleDateString()} · 사건 {s.caseId} → {peers.find((p) => p.id === s.peerId)?.name ?? s.peerId} · {s.status}
            </li>
          ))}
          {shares.length === 0 && <li className="text-text-muted">기록 없음.</li>}
        </ul>
      </section>

      <section>
        <h3 className="text-base font-bold">재배정 · 수수료</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {handoffs.slice(-10).reverse().map((h) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-line px-3 py-1.5">
              <span>
                {new Date(h.createdAt).toLocaleDateString()} · 사건 {h.caseId} · {peers.find((p) => p.id === h.peerId)?.name ?? h.peerId} · 원 {h.splitPct}% / 파트너 {100 - h.splitPct}% · {h.status}
              </span>
              {h.status === "proposed" && (
                <span className="flex gap-1">
                  <button type="button" disabled={busy}
                    onClick={() => post({ action: "update-handoff", handoffId: h.id, status: "accepted" })}
                    className="rounded bg-primary px-2 py-1 text-xs text-white">수락</button>
                  <button type="button" disabled={busy}
                    onClick={() => post({ action: "update-handoff", handoffId: h.id, status: "cancelled" })}
                    className="rounded border border-line px-2 py-1 text-xs">취소</button>
                </span>
              )}
              {h.status === "accepted" && (
                <button type="button" disabled={busy}
                  onClick={() => post({ action: "update-handoff", handoffId: h.id, status: "completed" })}
                  className="rounded bg-primary px-2 py-1 text-xs text-white">종결</button>
              )}
            </li>
          ))}
          {handoffs.length === 0 && <li className="text-text-muted">기록 없음.</li>}
        </ul>
      </section>
    </div>
  );
}
