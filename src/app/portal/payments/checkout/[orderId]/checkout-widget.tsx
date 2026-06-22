"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";

interface Props {
  clientKey: string;
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
}

export function CheckoutWidget({
  clientKey,
  orderId,
  orderName,
  amount,
  customerName,
  customerEmail,
}: Props) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const methodsRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tp = await loadTossPayments(clientKey);
        const customerKey =
          typeof window !== "undefined"
            ? window.localStorage.getItem("ethos.customer_key") ||
              (() => {
                const k = `ck_${crypto.randomUUID()}`;
                window.localStorage.setItem("ethos.customer_key", k);
                return k;
              })()
            : `ck_${crypto.randomUUID()}`;
        const w = tp.widgets({ customerKey });
        if (!mounted) return;
        await w.setAmount({ currency: "KRW", value: amount });
        if (methodsRef.current) {
          await w.renderPaymentMethods({
            selector: "#toss-payment-methods",
            variantKey: "DEFAULT",
          });
        }
        if (agreementRef.current) {
          await w.renderAgreement({
            selector: "#toss-agreement",
            variantKey: "AGREEMENT",
          });
        }
        setWidgets(w);
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "위젯 로드 실패");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [clientKey, amount]);

  async function pay() {
    if (!widgets) return;
    setBusy(true);
    setError(null);
    try {
      await widgets.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/portal/payments/success?orderId=${encodeURIComponent(orderId)}`,
        failUrl: `${window.location.origin}/portal/payments/fail?orderId=${encodeURIComponent(orderId)}`,
        customerEmail,
        customerName,
      });
      // Toss가 successUrl로 리다이렉트 — 도달 못 함
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제 요청 실패");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}
      <div ref={methodsRef} id="toss-payment-methods" />
      <div ref={agreementRef} id="toss-agreement" />
      <button
        type="button"
        onClick={pay}
        disabled={!ready || busy}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary font-serif text-base font-bold text-white transition hover:bg-text-strong disabled:opacity-50"
      >
        {!ready ? "결제 위젯 로드중…" : busy ? "결제창 여는 중…" : "결제하기"}
      </button>
      <p className="text-center text-xs text-text-muted">
        결제는 Toss Payments를 통해 안전하게 처리됩니다.
      </p>
    </div>
  );
}
