"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Card } from "@/components/ui/card";
import { parseClientApiError } from "@/lib/http/client-api";
import { formatDate, stringifyDateForInput } from "@/lib/utils";
import {
  accountingFeeStatusValues,
  accountingPaymentStatusValues,
  type AccountingFeeStatusValue,
  type AccountingPaymentStatusValue
} from "@/types/case-matter";

type AccountingMemo = {
  id: string;
  feeAmount: number | null;
  feeStatus: AccountingFeeStatusValue;
  paymentStatus: AccountingPaymentStatusValue;
  paidAmount: number | null;
  paidAt: Date | null;
  paymentMemo: string | null;
  invoiceMemo: string | null;
  ledgerMemo: string | null;
  updatedAt: string;
} | null;

type QuoteReference = {
  status: string;
  totalMin: number;
  totalMax: number;
};

type ContractReference = {
  status: string;
};

type Draft = {
  feeAmount: string;
  feeStatus: AccountingFeeStatusValue;
  paymentStatus: AccountingPaymentStatusValue;
  paidAmount: string;
  paidAt: string;
  paymentMemo: string;
  invoiceMemo: string;
  ledgerMemo: string;
};

type CaseAccountingMemoPanelProps = {
  caseMatterId: string;
  caseMatterUpdatedAt: string;
  accountingMemo: AccountingMemo;
  quoteReferences: QuoteReference[];
  contractReferences: ContractReference[];
};

const feeStatusLabels: Record<AccountingFeeStatusValue, string> = {
  UNSET: "미설정",
  ESTIMATED: "예상",
  CONFIRMED: "확정",
  WAIVED: "면제"
};

const paymentStatusLabels: Record<AccountingPaymentStatusValue, string> = {
  UNSET: "미설정",
  UNPAID: "미입금",
  PARTIAL: "일부 입금",
  PAID: "입금 완료",
  REFUNDED: "환불"
};

function draftFromMemo(memo: AccountingMemo): Draft {
  return {
    feeAmount: memo?.feeAmount == null ? "" : String(memo.feeAmount),
    feeStatus: memo?.feeStatus ?? "UNSET",
    paymentStatus: memo?.paymentStatus ?? "UNSET",
    paidAmount: memo?.paidAmount == null ? "" : String(memo.paidAmount),
    paidAt: stringifyDateForInput(memo?.paidAt ?? null),
    paymentMemo: memo?.paymentMemo ?? "",
    invoiceMemo: memo?.invoiceMemo ?? "",
    ledgerMemo: memo?.ledgerMemo ?? ""
  };
}

function amountText(value: number | null) {
  if (value == null) return "-";
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function quoteAmountRange(quote: QuoteReference) {
  if (quote.totalMin <= 0 && quote.totalMax <= 0) return "-";
  const formatter = new Intl.NumberFormat("ko-KR");
  if (quote.totalMin === quote.totalMax) return `${formatter.format(quote.totalMin)}원`;
  return `${formatter.format(quote.totalMin)}~${formatter.format(quote.totalMax)}원`;
}

function parseAmount(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

export function CaseAccountingMemoPanel({
  caseMatterId,
  caseMatterUpdatedAt,
  accountingMemo,
  quoteReferences,
  contractReferences
}: CaseAccountingMemoPanelProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => draftFromMemo(accountingMemo));
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function setField(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const feeAmount = parseAmount(draft.feeAmount);
    const paidAmount = parseAmount(draft.paidAmount);
    if (feeAmount != null && (!Number.isInteger(feeAmount) || feeAmount < 0)) {
      setMessage("수임금액은 0 이상의 정수로 입력하세요.");
      return;
    }
    if (paidAmount != null && (!Number.isInteger(paidAmount) || paidAmount < 0)) {
      setMessage("입금액은 0 이상의 정수로 입력하세요.");
      return;
    }

    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/case-matters/${caseMatterId}/accounting`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          feeAmount,
          feeStatus: draft.feeStatus,
          paymentStatus: draft.paymentStatus,
          paidAmount,
          paidAt: draft.paidAt || null,
          paymentMemo: draft.paymentMemo.trim() || null,
          invoiceMemo: draft.invoiceMemo.trim() || null,
          ledgerMemo: draft.ledgerMemo.trim() || null,
          actorName: "admin",
          expectedUpdatedAt: accountingMemo?.updatedAt,
          expectedCaseUpdatedAt: accountingMemo ? undefined : caseMatterUpdatedAt
        })
      });

      if (!response.ok) {
        setMessage(await parseClientApiError(response, "수임관리 메모를 저장하지 못했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        return;
      }

      setMessage("수임관리 메모를 저장했습니다. 최신 상태를 다시 불러옵니다.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-kicker">Accounting memo</p>
          <h3 className="text-lg font-semibold text-text-strong">수임관리 메모</h3>
          <p className="mt-1 text-sm text-text-muted">
            사건별 수임료, 입금 상태, 장부 비고를 관리자 전용으로 기록합니다.
          </p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface-muted px-3 py-2">
            <p className="text-xs text-text-muted">수임상태</p>
            <p className="font-semibold text-text-strong">{feeStatusLabels[draft.feeStatus]}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-muted px-3 py-2">
            <p className="text-xs text-text-muted">입금상태</p>
            <p className="font-semibold text-text-strong">{paymentStatusLabels[draft.paymentStatus]}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg border border-line bg-surface-muted p-3 text-sm lg:grid-cols-3">
        <div>
          <p className="text-xs text-text-muted">현재 수임금액</p>
          <p className="font-semibold text-text-strong">{amountText(accountingMemo?.feeAmount ?? null)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">현재 입금액</p>
          <p className="font-semibold text-text-strong">{amountText(accountingMemo?.paidAmount ?? null)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">입금일</p>
          <p className="font-semibold text-text-strong">{formatDate(accountingMemo?.paidAt ?? null)}</p>
        </div>
      </div>

      {(quoteReferences.length > 0 || contractReferences.length > 0) && (
        <div className="mt-4 rounded-lg border border-line bg-surface p-3">
          <p className="text-xs font-semibold text-text-muted">견적/계약 참고값</p>
          <div className="mt-2 grid gap-2 text-sm lg:grid-cols-2">
            {quoteReferences.slice(0, 2).map((quote, index) => (
              <p key={`${quote.status}-${index}`} className="text-text">
                견적 {quote.status}: {quoteAmountRange(quote)}
              </p>
            ))}
            {contractReferences.slice(0, 2).map((contract, index) => (
              <p key={`${contract.status}-${index}`} className="text-text">
                계약 초안: {contract.status}
              </p>
            ))}
          </div>
        </div>
      )}

      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <div className="grid gap-3 lg:grid-cols-4">
          <label className="space-y-1 text-sm font-medium text-text">
            수임금액
            <input
              type="number"
              min="0"
              value={draft.feeAmount}
              onChange={(event) => setField({ feeAmount: event.target.value })}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-text">
            수임상태
            <select
              value={draft.feeStatus}
              onChange={(event) => setField({ feeStatus: event.target.value as AccountingFeeStatusValue })}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            >
              {accountingFeeStatusValues.map((status) => (
                <option key={status} value={status}>
                  {feeStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-text">
            입금상태
            <select
              value={draft.paymentStatus}
              onChange={(event) =>
                setField({ paymentStatus: event.target.value as AccountingPaymentStatusValue })
              }
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            >
              {accountingPaymentStatusValues.map((status) => (
                <option key={status} value={status}>
                  {paymentStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-text">
            입금액
            <input
              type="number"
              min="0"
              value={draft.paidAmount}
              onChange={(event) => setField({ paidAmount: event.target.value })}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            />
          </label>
        </div>

        <label className="max-w-xs space-y-1 text-sm font-medium text-text">
          입금일
          <input
            type="date"
            value={draft.paidAt}
            onChange={(event) => setField({ paidAt: event.target.value })}
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
          />
        </label>

        <div className="grid gap-3 lg:grid-cols-3">
          <label className="space-y-1 text-sm font-medium text-text">
            입금 메모
            <textarea
              value={draft.paymentMemo}
              onChange={(event) => setField({ paymentMemo: event.target.value })}
              rows={4}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text-strong outline-none focus:border-line-strong"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-text">
            증빙/영수 메모
            <textarea
              value={draft.invoiceMemo}
              onChange={(event) => setField({ invoiceMemo: event.target.value })}
              rows={4}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text-strong outline-none focus:border-line-strong"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-text">
            장부 비고
            <textarea
              value={draft.ledgerMemo}
              onChange={(event) => setField({ ledgerMemo: event.target.value })}
              rows={4}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text-strong outline-none focus:border-line-strong"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
          >
            저장
          </button>
          {message && <p className="text-sm text-text-muted">{message}</p>}
        </div>
      </form>
    </Card>
  );
}
