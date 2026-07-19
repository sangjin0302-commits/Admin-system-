"use client";

import { useCallback, useEffect, useState } from "react";

interface Plan {
  tier: string;
  label: string;
  priceKrw: number;
  monthlyQuota: number;
}

interface Payload {
  ok: boolean;
  subscription: { userId: string; tier: string; startedAt: string; renewsAt?: string };
  usage: { used: number; quota: number; remaining: number; monthKey: string };
  plans: Record<string, Plan>;
}

// 이메일 입력칸은 제거됐다. 대상은 언제나 로그인한 본인이며, 서버가 세션에서
// 신원을 읽는다. 예전에는 아무 이메일이나 넣어 남의 구독을 조회·해지할 수 있었다.
export function SubscriptionClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/portal/subscription");
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
    load();
  }, [load]);

  async function act(action: "upgrade" | "cancel") {
    setBusy(true);
    try {
      await fetch("/api/portal/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const usagePct =
    data && data.usage.quota > 0
      ? Math.min(100, Math.round((data.usage.used / data.usage.quota) * 100))
      : data && data.usage.quota < 0
        ? 0
        : 0;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-sm text-text-muted">현재 요금제</p>
          <p className="mt-1 font-serif text-2xl font-bold text-primary">
            {data.plans[data.subscription.tier]?.label ?? data.subscription.tier}
          </p>

          <p className="mt-6 text-sm text-text-muted">
            이번 달 사용량 ({data.usage.monthKey})
          </p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-gold-soft/40">
            <div
              className="h-full bg-primary"
              style={{ width: `${usagePct}%` }}
              aria-hidden
            />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {data.usage.used} /{" "}
            {data.usage.quota < 0 ? "무제한" : data.usage.quota}
          </p>

          <div className="mt-6 flex gap-2">
            {data.subscription.tier === "free" ? (
              <button
                type="button"
                onClick={() => act("upgrade")}
                disabled={busy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Pro로 업그레이드
              </button>
            ) : (
              <button
                type="button"
                onClick={() => act("cancel")}
                disabled={busy}
                className="rounded-lg border border-red-400 px-4 py-2 text-sm font-bold text-red-500 disabled:opacity-50"
              >
                구독 취소
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
