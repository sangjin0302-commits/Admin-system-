"use client";

import { useCallback, useEffect, useState } from "react";

type VipPlan = "silver" | "gold" | "platinum";

interface PlanConfig {
  plan: VipPlan;
  label: string;
  priceKrw: number;
  discountPct: number;
  benefits: string[];
  slaHours: number;
}

interface Membership {
  userId: string;
  plan: VipPlan;
  startedAt: string;
  expiresAt: string;
  monthlyBilling: boolean;
  benefitsUsed: {
    inquiriesThisMonth: number;
    consultationsThisMonth: number;
    discountAppliedKrw: number;
    monthKey: string;
  };
}

interface Payload {
  ok: boolean;
  plans: Record<VipPlan, PlanConfig>;
  membership: Membership | null;
}

export function VipPortalClient() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (uid: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/portal/vip?userId=${encodeURIComponent(uid)}`);
      const json = (await res.json()) as Payload;
      if (json.ok) setData(json);
      else setError("조회 실패");
    } catch {
      setError("네트워크 오류");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem("portal.email");
      if (cached) {
        setEmail(cached);
        load(cached);
      }
    }
  }, [load]);

  async function act(action: "subscribe" | "cancel", plan?: VipPlan) {
    if (!email) return;
    setBusy(true);
    try {
      await fetch("/api/portal/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: email, action, plan }),
      });
      await load(email);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="이메일 입력"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined")
              window.localStorage.setItem("portal.email", email);
            load(email);
          }}
          disabled={!email || busy}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          조회
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && data.membership && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-sm text-text-muted">현재 요금제</p>
          <p className="mt-1 font-serif text-2xl font-bold text-primary">
            {data.plans[data.membership.plan].label}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {new Date(data.membership.startedAt).toLocaleDateString("ko-KR")} 시작 · 다음 결제{" "}
            {new Date(data.membership.expiresAt).toLocaleDateString("ko-KR")}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs text-text-muted">이번 달 문의</p>
              <p className="mt-1 text-sm">{data.membership.benefitsUsed.inquiriesThisMonth}건</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">누적 할인 혜택</p>
              <p className="mt-1 text-sm">
                ₩{data.membership.benefitsUsed.discountAppliedKrw.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(["silver", "gold", "platinum"] as VipPlan[]).map((p) => (
              p !== data.membership!.plan ? (
                <button
                  key={p}
                  type="button"
                  disabled={busy}
                  onClick={() => act("subscribe", p)}
                  className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary disabled:opacity-50"
                >
                  {data.plans[p].label}로 변경
                </button>
              ) : null
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={() => act("cancel")}
              className="rounded-lg border border-red-400 px-4 py-2 text-sm font-bold text-red-500 disabled:opacity-50"
            >
              구독 취소
            </button>
          </div>
        </div>
      )}

      {data && !data.membership && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-sm text-text-muted">활성 VIP 회원이 아닙니다.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(["silver", "gold", "platinum"] as VipPlan[]).map((p) => (
              <button
                key={p}
                type="button"
                disabled={busy}
                onClick={() => act("subscribe", p)}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {data.plans[p].label} ₩{data.plans[p].priceKrw.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
