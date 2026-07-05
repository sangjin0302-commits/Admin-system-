"use client";

import { useState } from "react";
import type { ShippingRequest, ShippingStatus } from "@/lib/services/document-shipping-service";
import type { NotaryRequest, NotaryStatus } from "@/lib/services/notary-integration-service";

const SHIP_STATUSES: ShippingStatus[] = ["requested", "quoted", "in_transit", "delivered", "cancelled"];
const NOTARY_STATUSES: NotaryStatus[] = ["requested", "in_progress", "completed", "cancelled"];

export function InternationalAdminClient({
  initialShipping,
  initialNotary,
}: {
  initialShipping: ShippingRequest[];
  initialNotary: NotaryRequest[];
}) {
  const [shipping, setShipping] = useState<ShippingRequest[]>(initialShipping);
  const [notary, setNotary] = useState<NotaryRequest[]>(initialNotary);
  const [busy, setBusy] = useState(false);

  const totalShipCost = shipping.reduce((s, r) => s + r.costKrw, 0);
  const totalNotaryCost = notary.reduce((s, r) => s + r.costKrw, 0);

  async function updateShip(id: string, status: ShippingStatus, trackingNumber?: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/international", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "shipping", id, status, trackingNumber }),
      });
      const json = (await res.json()) as { ok: boolean; shipping?: ShippingRequest[] };
      if (json.ok && json.shipping) setShipping(json.shipping);
    } finally { setBusy(false); }
  }
  async function updateNotary(id: string, status: NotaryStatus) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/international", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "notary", id, status }),
      });
      const json = (await res.json()) as { ok: boolean; notary?: NotaryRequest[] };
      if (json.ok && json.notary) setNotary(json.notary);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-text-muted">배송 총 견적</p>
          <p className="text-2xl font-bold text-primary">₩{totalShipCost.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-text-muted">공증 총 견적</p>
          <p className="text-2xl font-bold text-primary">₩{totalNotaryCost.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="font-serif text-lg font-bold text-primary">배송 요청</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-line text-left"><th className="p-2">신청자</th><th className="p-2">문서</th><th className="p-2">국가</th><th className="p-2">비용</th><th className="p-2">상태</th><th className="p-2">트래킹</th></tr></thead>
            <tbody>
              {shipping.map((r) => (
                <tr key={r.id} className="border-b border-line/50">
                  <td className="p-2">{r.userId}</td>
                  <td className="p-2">{r.documents.length}건</td>
                  <td className="p-2">{r.destination.country}</td>
                  <td className="p-2">₩{r.costKrw.toLocaleString()}</td>
                  <td className="p-2">
                    <select value={r.status} disabled={busy} onChange={(e) => updateShip(r.id, e.target.value as ShippingStatus)} className="rounded border border-line px-2 py-1 text-xs">
                      {SHIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <input defaultValue={r.trackingNumber ?? ""} onBlur={(e) => updateShip(r.id, r.status, e.target.value)} placeholder="tracking#" className="rounded border border-line px-2 py-1 text-xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="font-serif text-lg font-bold text-primary">공증 요청</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-line text-left"><th className="p-2">신청자</th><th className="p-2">문서</th><th className="p-2">유형</th><th className="p-2">긴급도</th><th className="p-2">비용</th><th className="p-2">상태</th></tr></thead>
            <tbody>
              {notary.map((r) => (
                <tr key={r.id} className="border-b border-line/50">
                  <td className="p-2">{r.userId}</td>
                  <td className="p-2">{r.documentTitle}</td>
                  <td className="p-2">{r.documentType}</td>
                  <td className="p-2">{r.urgency}</td>
                  <td className="p-2">₩{r.costKrw.toLocaleString()}</td>
                  <td className="p-2">
                    <select value={r.status} disabled={busy} onChange={(e) => updateNotary(r.id, e.target.value as NotaryStatus)} className="rounded border border-line px-2 py-1 text-xs">
                      {NOTARY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
