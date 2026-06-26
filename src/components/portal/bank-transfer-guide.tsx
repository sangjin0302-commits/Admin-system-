"use client";

import { useState } from "react";

export function BankTransferGuide({
  orderId,
  orderName,
  amount,
  customerName,
  bankName,
  accountNumber,
  accountHolder
}: {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    });
  }

  const depositorName = `${customerName} ${orderId.slice(-4)}`;

  if (!bankName || !accountNumber) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
        <p className="font-serif text-sm font-bold text-amber-900">계좌 정보 준비 중</p>
        <p className="mt-2 text-xs leading-6 text-amber-800">
          계좌 정보가 등록되지 않았습니다. 관리자에게 문의해 주세요.
          관리자에서는 <code className="rounded bg-amber-100 px-1">/admin/site-content</code> →
          payment.bankName / payment.accountNumber / payment.accountHolder 입력 후 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">계좌이체</span>
          <p className="font-serif text-sm font-bold text-emerald-900">아래 계좌로 입금해 주세요</p>
        </div>

        <dl className="mt-5 space-y-3">
          <div>
            <dt className="font-serif text-[10px] font-bold uppercase tracking-wider text-emerald-800">은행</dt>
            <dd className="mt-1 flex items-center justify-between gap-2">
              <span className="font-serif text-base font-bold text-emerald-900">{bankName}</span>
            </dd>
          </div>
          <div>
            <dt className="font-serif text-[10px] font-bold uppercase tracking-wider text-emerald-800">계좌번호</dt>
            <dd className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-lg font-bold tracking-wider text-emerald-900">{accountNumber}</span>
              <button
                type="button"
                onClick={() => copy(accountNumber, "acct")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
              >
                {copied === "acct" ? "✓ 복사됨" : "복사"}
              </button>
            </dd>
          </div>
          {accountHolder && (
            <div>
              <dt className="font-serif text-[10px] font-bold uppercase tracking-wider text-emerald-800">예금주</dt>
              <dd className="mt-1 font-serif text-sm font-bold text-emerald-900">{accountHolder}</dd>
            </div>
          )}
          <div>
            <dt className="font-serif text-[10px] font-bold uppercase tracking-wider text-emerald-800">입금자명</dt>
            <dd className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-emerald-900">{depositorName}</span>
              <button
                type="button"
                onClick={() => copy(depositorName, "name")}
                className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                {copied === "name" ? "✓ 복사됨" : "복사"}
              </button>
            </dd>
            <p className="mt-1 text-[11px] text-emerald-800">※ 자동 매칭을 위해 위 이름으로 입금해 주세요</p>
          </div>
          <div>
            <dt className="font-serif text-[10px] font-bold uppercase tracking-wider text-emerald-800">금액</dt>
            <dd className="mt-1 font-serif text-xl font-bold text-emerald-900 tabular-nums">
              {amount.toLocaleString("ko-KR")}원
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-gold/30 bg-gold-soft/20 p-4 text-xs leading-6 text-text">
        <p className="font-bold text-primary">입금 확인 안내</p>
        <ul className="mt-2 space-y-1 text-text-muted">
          <li>· 입금 확인 후 영업일 기준 1~2시간 내 안내드립니다</li>
          <li>· 영업시간 외 입금은 다음 영업일에 확인됩니다</li>
          <li>· 세금계산서/현금영수증 필요 시 별도 요청해 주세요</li>
          <li>· 주문: <span className="font-mono">{orderName}</span></li>
        </ul>
      </div>
    </div>
  );
}
