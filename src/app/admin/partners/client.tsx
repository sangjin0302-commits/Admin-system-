"use client";

import { useState } from "react";
import type {
  CommissionEntry,
  PartnerStats,
} from "@/lib/services/partner-referral-service";

interface Props {
  initialStats: PartnerStats[];
  initialCommissions: CommissionEntry[];
}

export function PartnersAdminClient({ initialStats, initialCommissions }: Props) {
  const [stats, setStats] = useState<PartnerStats[]>(initialStats);
  const [commissions, setCommissions] = useState<CommissionEntry[]>(initialCommissions);
  const [busy, setBusy] = useState<string>("");

  async function refresh() {
    const res = await fetch("/api/admin/partners");
    const json = await res.json();
    if (json.ok) {
      setStats(json.stats);
      setCommissions(json.commissions);
    }
  }

  async function post(action: string, extra: Record<string, unknown>) {
    setBusy(`${action}:${JSON.stringify(extra)}`);
    try {
      await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      await refresh();
    } finally {
      setBusy("");
    }
  }

  const pending = stats.filter((s) => s.partner.status === "pending");
  const approved = stats.filter((s) => s.partner.status === "approved");

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-text-strong">승인 대기 ({pending.length})</h3>
          <ul className="mt-2 space-y-2">
            {pending.map((s) => (
              <li
                key={s.partner.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">{s.partner.name} · {s.partner.category}</p>
                  <p className="text-xs text-text-muted">
                    {s.partner.email} · code {s.partner.referralCode}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy.startsWith("approve")}
                  onClick={() => post("approve", { partnerId: s.partner.id })}
                  className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-white"
                >
                  승인
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-base font-bold text-text-strong">활성 파트너 ({approved.length})</h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">분야</th>
                <th className="px-3 py-2">추천코드</th>
                <th className="px-3 py-2">요율</th>
                <th className="px-3 py-2 text-right">소개건수</th>
                <th className="px-3 py-2 text-right">누적수수료</th>
                <th className="px-3 py-2 text-right">미지급</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((s) => (
                <tr key={s.partner.id} className="border-t border-line">
                  <td className="px-3 py-2 font-semibold">{s.partner.name}</td>
                  <td className="px-3 py-2">{s.partner.category}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.partner.referralCode}</td>
                  <td className="px-3 py-2">{(s.partner.commissionRate * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-right">{s.referralCount}</td>
                  <td className="px-3 py-2 text-right">₩{s.commissionEarned.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">₩{s.commissionUnpaid.toLocaleString()}</td>
                </tr>
              ))}
              {approved.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-text-muted">
                    승인된 파트너가 아직 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-base font-bold text-text-strong">수수료 내역</h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-3 py-2">일자</th>
                <th className="px-3 py-2">파트너</th>
                <th className="px-3 py-2">사건</th>
                <th className="px-3 py-2 text-right">수임료</th>
                <th className="px-3 py-2 text-right">수수료</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => {
                const partner = stats.find((s) => s.partner.id === c.partnerId)?.partner;
                return (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-3 py-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{partner?.name ?? c.partnerId}</td>
                    <td className="px-3 py-2 font-mono text-xs">{c.caseMatterId}</td>
                    <td className="px-3 py-2 text-right">₩{c.fee.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">₩{c.amount.toLocaleString()}</td>
                    <td className="px-3 py-2">{c.paid ? "지급 완료" : "미지급"}</td>
                    <td className="px-3 py-2">
                      {!c.paid && (
                        <button
                          type="button"
                          disabled={busy.startsWith("mark-commission-paid")}
                          onClick={() => post("mark-commission-paid", { commissionId: c.id })}
                          className="rounded bg-primary px-2 py-1 text-xs font-bold text-white"
                        >
                          지급 완료 표시
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {commissions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-text-muted">
                    아직 정산할 수수료가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
