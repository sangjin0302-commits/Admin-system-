"use client";

import { useState } from "react";
import type {
  TaxPartner,
  TaxPartnerStats,
  TaxReferral,
  TaxSpecialty,
} from "@/lib/services/tax-partner-referral-service";

const SPECIALTIES: TaxSpecialty[] = ["개인", "법인", "부가세", "양도세", "상속", "기타"];

interface Props {
  initialStats: TaxPartnerStats[];
  initialReferrals: TaxReferral[];
}

export function TaxPartnersAdminClient({ initialStats, initialReferrals }: Props) {
  const [stats, setStats] = useState<TaxPartnerStats[]>(initialStats);
  const [referrals, setReferrals] = useState<TaxReferral[]>(initialReferrals);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<TaxPartner[] | null>(null);
  const [matchForm, setMatchForm] = useState({
    taxIssue: "", urgency: "normal" as "low" | "normal" | "high", location: "",
  });
  const [addForm, setAddForm] = useState({
    name: "", firm: "", specialties: [] as TaxSpecialty[], location: "",
    contactEmail: "", contactPhone: "", commissionRate: "0.10", notes: "",
  });

  async function refresh() {
    const res = await fetch("/api/admin/tax-partners");
    const j = await res.json();
    if (j.ok) {
      setStats(j.stats);
      setReferrals(j.referrals);
    }
  }

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/tax-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      await refresh();
      return j;
    } finally {
      setBusy(false);
    }
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    await post({
      action: "add",
      data: {
        name: addForm.name,
        firm: addForm.firm,
        specialties: addForm.specialties,
        location: addForm.location,
        contactEmail: addForm.contactEmail,
        contactPhone: addForm.contactPhone || undefined,
        commissionRate: Number(addForm.commissionRate),
        notes: addForm.notes || undefined,
      },
    });
    setAddForm({
      name: "", firm: "", specialties: [], location: "",
      contactEmail: "", contactPhone: "", commissionRate: "0.10", notes: "",
    });
  }

  async function doMatch() {
    if (!matchForm.taxIssue) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/tax-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "match", ...matchForm }),
      });
      const j = await res.json();
      if (j.ok) setMatches(j.matches);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-line p-4">
        <h3 className="text-base font-bold">세무사 매칭 도구</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
          <input required placeholder="세무 이슈 (예: 법인 종합소득 신고)"
            value={matchForm.taxIssue}
            onChange={(e) => setMatchForm({ ...matchForm, taxIssue: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm md:col-span-2" />
          <select value={matchForm.urgency}
            onChange={(e) => setMatchForm({ ...matchForm, urgency: e.target.value as never })}
            className="h-10 rounded border border-line px-3 text-sm">
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">긴급</option>
          </select>
          <input placeholder="지역 (선택)" value={matchForm.location}
            onChange={(e) => setMatchForm({ ...matchForm, location: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
        </div>
        <button type="button" onClick={doMatch} disabled={busy}
          className="mt-3 rounded bg-primary px-4 py-2 text-sm font-bold text-white">
          추천 받기
        </button>
        {matches && (
          <ul className="mt-3 space-y-2">
            {matches.map((p) => (
              <li key={p.id} className="rounded border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                <b>{p.name}</b> · {p.firm} · {p.location} · {p.specialties.join(", ") || "전문분야 미상"}
                <span className="ml-2 text-xs text-text-muted">
                  수수료 {(p.commissionRate * 100).toFixed(0)}%
                </span>
              </li>
            ))}
            {matches.length === 0 && <li className="text-text-muted">매칭된 세무사가 없습니다.</li>}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-base font-bold">파트너 세무사 ({stats.length})</h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">사무소</th>
                <th className="px-3 py-2">전문</th>
                <th className="px-3 py-2">지역</th>
                <th className="px-3 py-2">수수료</th>
                <th className="px-3 py-2 text-right">소개</th>
                <th className="px-3 py-2 text-right">완료</th>
                <th className="px-3 py-2 text-right">누적</th>
                <th className="px-3 py-2 text-right">미지급</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.partner.id} className="border-t border-line">
                  <td className="px-3 py-2 font-semibold">{s.partner.name}</td>
                  <td className="px-3 py-2">{s.partner.firm}</td>
                  <td className="px-3 py-2 text-xs">{s.partner.specialties.join(", ")}</td>
                  <td className="px-3 py-2">{s.partner.location}</td>
                  <td className="px-3 py-2">{(s.partner.commissionRate * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-right">{s.referralCount}</td>
                  <td className="px-3 py-2 text-right">{s.completedCount}</td>
                  <td className="px-3 py-2 text-right">₩{s.commissionEarned.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">₩{s.commissionUnpaid.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <button type="button" disabled={busy}
                      onClick={() => post({ action: "delete", id: s.partner.id })}
                      className="text-xs text-red-600">삭제</button>
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-text-muted">파트너가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-base font-bold">신규 파트너 등록</h3>
        <form onSubmit={submitAdd} className="mt-2 grid grid-cols-1 gap-3 rounded-lg border border-line p-4 md:grid-cols-2">
          <input required placeholder="세무사명" value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
          <input required placeholder="사무소" value={addForm.firm}
            onChange={(e) => setAddForm({ ...addForm, firm: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
          <input required placeholder="이메일" value={addForm.contactEmail}
            onChange={(e) => setAddForm({ ...addForm, contactEmail: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
          <input placeholder="전화 (선택)" value={addForm.contactPhone}
            onChange={(e) => setAddForm({ ...addForm, contactPhone: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
          <input required placeholder="지역" value={addForm.location}
            onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
          <input required type="number" step="0.01" min="0" max="1" placeholder="수수료율 (0~1)"
            value={addForm.commissionRate}
            onChange={(e) => setAddForm({ ...addForm, commissionRate: e.target.value })}
            className="h-10 rounded border border-line px-3 text-sm" />
          <div className="md:col-span-2">
            <p className="text-xs text-text-muted">전문분야</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {SPECIALTIES.map((s) => (
                <label key={s} className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={addForm.specialties.includes(s)}
                    onChange={(e) => setAddForm({
                      ...addForm,
                      specialties: e.target.checked
                        ? [...addForm.specialties, s]
                        : addForm.specialties.filter((x) => x !== s),
                    })} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <textarea placeholder="메모" value={addForm.notes}
            onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
            className="min-h-[60px] rounded border border-line p-3 text-sm md:col-span-2" />
          <button type="submit" disabled={busy}
            className="rounded bg-primary px-4 py-2 text-sm font-bold text-white md:col-span-2">
            등록
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-base font-bold">소개 내역</h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-3 py-2">일자</th>
                <th className="px-3 py-2">파트너</th>
                <th className="px-3 py-2">고객</th>
                <th className="px-3 py-2">이슈</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2 text-right">수수료</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {referrals.slice().reverse().map((r) => {
                const partner = stats.find((s) => s.partner.id === r.partnerId)?.partner;
                return (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-3 py-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{partner?.name ?? r.partnerId}</td>
                    <td className="px-3 py-2">{r.clientName}</td>
                    <td className="px-3 py-2 text-xs">{r.taxIssue}</td>
                    <td className="px-3 py-2">
                      {r.status}
                      {r.status === "completed" && r.commissionPaid && " · 지급"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.commissionAmount ? `₩${r.commissionAmount.toLocaleString()}` : "-"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.status === "sent" && (
                        <button type="button" disabled={busy}
                          onClick={() => {
                            const fee = Number(prompt("실제 수임료(원)를 입력하세요") ?? 0);
                            if (fee > 0) void post({ action: "complete", referralId: r.id, actualFee: fee });
                          }}
                          className="rounded bg-primary px-2 py-1 text-white">완료 처리</button>
                      )}
                      {r.status === "completed" && !r.commissionPaid && (
                        <button type="button" disabled={busy}
                          onClick={() => post({ action: "mark-paid", referralId: r.id })}
                          className="rounded border border-line px-2 py-1">지급 표시</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {referrals.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-text-muted">아직 소개 이력이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
