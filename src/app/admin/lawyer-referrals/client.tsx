"use client";

import { useState } from "react";
import type { PartnerLawyer, Referral, ReferralStatus } from "@/lib/services/lawyer-referral-service";

const STATUSES: ReferralStatus[] = ["matched", "contacted", "engaged", "closed_won", "closed_lost"];

export function LawyerReferralsClient({
  initialPartners,
  initialReferrals,
  initialCommissions,
}: {
  initialPartners: PartnerLawyer[];
  initialReferrals: Referral[];
  initialCommissions: number;
}) {
  const [partners, setPartners] = useState<PartnerLawyer[]>(initialPartners);
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  const [commissions, setCommissions] = useState<number>(initialCommissions);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", firm: "", specialties: "", location: "", phone: "", email: "", commissionRate: 0.15,
  });

  async function addPartner() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/lawyer-referrals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "partner.upsert",
          partner: {
            name: form.name, firm: form.firm,
            specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
            location: form.location,
            contact: { phone: form.phone, email: form.email },
            commissionRate: Number(form.commissionRate) || 0.15,
            active: true,
          },
        }),
      });
      const json = (await res.json()) as { ok: boolean; partners?: PartnerLawyer[] };
      if (json.ok && json.partners) {
        setPartners(json.partners);
        setForm({ name: "", firm: "", specialties: "", location: "", phone: "", email: "", commissionRate: 0.15 });
      }
    } finally { setBusy(false); }
  }

  async function removePartner(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/lawyer-referrals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "partner.delete", partnerId: id }),
      });
      const json = (await res.json()) as { ok: boolean; partners?: PartnerLawyer[] };
      if (json.ok && json.partners) setPartners(json.partners);
    } finally { setBusy(false); }
  }

  async function setStatus(id: string, status: ReferralStatus) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/lawyer-referrals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "referral.update", referralId: id, status }),
      });
      const json = (await res.json()) as { ok: boolean; referrals?: Referral[]; commissions?: number };
      if (json.ok) {
        if (json.referrals) setReferrals(json.referrals);
        if (typeof json.commissions === "number") setCommissions(json.commissions);
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-text-muted">파트너</p><p className="text-2xl font-bold text-primary">{partners.length}</p></div>
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-text-muted">활성 소개</p><p className="text-2xl font-bold text-primary">{referrals.filter((r) => r.status !== "closed_lost" && r.status !== "closed_won").length}</p></div>
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-xs text-text-muted">누적 수수료</p><p className="text-2xl font-bold text-primary">₩{commissions.toLocaleString()}</p></div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="font-serif text-lg font-bold text-primary">파트너 변호사 추가</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <input placeholder="법무법인" value={form.firm} onChange={(e) => setForm({ ...form, firm: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <input placeholder="전문 분야 (쉼표)" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} className="rounded border border-line px-3 py-2 text-sm md:col-span-2" />
          <input placeholder="지역" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <input placeholder="전화" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <input placeholder="이메일" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded border border-line px-3 py-2 text-sm" />
          <input type="number" step="0.01" placeholder="수수료율 (0.15)" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} className="rounded border border-line px-3 py-2 text-sm" />
        </div>
        <button type="button" disabled={busy || !form.name} onClick={addPartner} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">파트너 추가</button>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="font-serif text-lg font-bold text-primary">파트너 디렉토리</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-line text-left"><th className="p-2">이름</th><th className="p-2">법인</th><th className="p-2">전문</th><th className="p-2">지역</th><th className="p-2">수수료</th><th className="p-2"></th></tr></thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b border-line/50">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.firm}</td>
                  <td className="p-2">{p.specialties.join(", ")}</td>
                  <td className="p-2">{p.location}</td>
                  <td className="p-2">{Math.round(p.commissionRate * 100)}%</td>
                  <td className="p-2 text-right"><button type="button" disabled={busy} onClick={() => removePartner(p.id)} className="text-xs text-red-500 underline">삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="font-serif text-lg font-bold text-primary">소개 이력</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-line text-left"><th className="p-2">Case</th><th className="p-2">분야</th><th className="p-2">긴급도</th><th className="p-2">파트너</th><th className="p-2">예상 수임</th><th className="p-2">커미션</th><th className="p-2">상태</th></tr></thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-b border-line/50">
                  <td className="p-2 font-mono text-xs">{r.caseId}</td>
                  <td className="p-2">{r.caseCategory}</td>
                  <td className="p-2">{r.urgency}</td>
                  <td className="p-2">{partners.find((p) => p.id === r.lawyerId)?.name ?? r.lawyerId}</td>
                  <td className="p-2">{r.estimatedFeeKrw ? `₩${r.estimatedFeeKrw.toLocaleString()}` : "-"}</td>
                  <td className="p-2">{r.commissionKrw ? `₩${r.commissionKrw.toLocaleString()}` : "-"}</td>
                  <td className="p-2">
                    <select value={r.status} disabled={busy} onChange={(e) => setStatus(r.id, e.target.value as ReferralStatus)} className="rounded border border-line px-2 py-1 text-xs">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
