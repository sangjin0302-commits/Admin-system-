"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Card } from "@/components/ui/card";
import { parseClientApiError } from "@/lib/http/client-api";
import { stringifyDateForInput } from "@/lib/utils";

type ContractDetailSnapshot = {
  id: string;
  contractType: string;
  counterpartyName: string | null;
  counterpartyContact: string | null;
  contractDate: Date | null;
  contractAmount: number | null;
  contractSummary: string | null;
  disputeContent: string | null;
  investigationStatus: string;
  investigationScope: string | null;
  reportDueDate: Date | null;
  reportDeliveredAt: Date | null;
  keyFindings: string | null;
  legalBasisSummary: string | null;
  updatedAt: string;
} | null;

type Props = {
  caseMatterId: string;
  caseMatterUpdatedAt: string;
  contractDetail: ContractDetailSnapshot;
};

const CONTRACT_TYPES = [
  { value: "SERVICE_CONTRACT", label: "용역계약" },
  { value: "LEASE_CONTRACT", label: "임대차계약" },
  { value: "EMPLOYMENT_CONTRACT", label: "고용계약" },
  { value: "PARTNERSHIP_CONTRACT", label: "동업계약" },
  { value: "FACT_INVESTIGATION", label: "사실조사" },
  { value: "OTHER", label: "기타" },
];

const INVESTIGATION_STATUSES = [
  { value: "REQUESTED", label: "요청됨" },
  { value: "IN_PROGRESS", label: "진행중" },
  { value: "REPORT_DRAFTED", label: "보고서 초안" },
  { value: "REPORT_DELIVERED", label: "보고서 납부" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELLED", label: "취소" },
];

export function ContractDetailPanel({ caseMatterId, contractDetail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [draft, setDraft] = useState({
    contractType: contractDetail?.contractType ?? "OTHER",
    counterpartyName: contractDetail?.counterpartyName ?? "",
    counterpartyContact: contractDetail?.counterpartyContact ?? "",
    contractDate: stringifyDateForInput(contractDetail?.contractDate),
    contractAmount: contractDetail?.contractAmount?.toString() ?? "",
    contractSummary: contractDetail?.contractSummary ?? "",
    disputeContent: contractDetail?.disputeContent ?? "",
    investigationStatus: contractDetail?.investigationStatus ?? "REQUESTED",
    investigationScope: contractDetail?.investigationScope ?? "",
    reportDueDate: stringifyDateForInput(contractDetail?.reportDueDate),
    reportDeliveredAt: stringifyDateForInput(contractDetail?.reportDeliveredAt),
    keyFindings: contractDetail?.keyFindings ?? "",
    legalBasisSummary: contractDetail?.legalBasisSummary ?? "",
  });

  function set(field: string, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const payload = {
          ...draft,
          contractAmount: draft.contractAmount ? parseInt(draft.contractAmount, 10) : undefined,
        };
        const res = await fetch(`/api/admin/case-matters/${caseMatterId}/contract-detail`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const msg = await parseClientApiError(res, "저장에 실패했습니다.");
          setError(msg);
          return;
        }
        setSaved(true);
        router.refresh();
      } catch {
        setError("저장 중 오류가 발생했습니다.");
      }
    });
  }

  const fieldClass = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-text-strong focus:outline-none focus:ring-2 focus:ring-primary/40";
  const labelClass = "mb-1 block text-xs font-semibold text-text-muted";

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-text-strong">계약서/사실조사 상세</h3>
      <p className="mt-1 text-xs text-text-muted">계약 유형, 상대방 정보, 사실조사 진행 현황을 기록합니다.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>계약/업무 유형</label>
            <select className={fieldClass} value={draft.contractType} onChange={(e) => set("contractType", e.target.value)}>
              {CONTRACT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>사실조사 상태</label>
            <select className={fieldClass} value={draft.investigationStatus} onChange={(e) => set("investigationStatus", e.target.value)}>
              {INVESTIGATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>상대방 이름</label>
            <input className={fieldClass} value={draft.counterpartyName} onChange={(e) => set("counterpartyName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>상대방 연락처</label>
            <input className={fieldClass} value={draft.counterpartyContact} onChange={(e) => set("counterpartyContact", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>계약일</label>
            <input type="date" className={fieldClass} value={draft.contractDate} onChange={(e) => set("contractDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>계약금액 (원)</label>
            <input type="number" className={fieldClass} value={draft.contractAmount} onChange={(e) => set("contractAmount", e.target.value)} placeholder="예: 5000000" />
          </div>
          <div>
            <label className={labelClass}>보고서 기한</label>
            <input type="date" className={fieldClass} value={draft.reportDueDate} onChange={(e) => set("reportDueDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>보고서 납부일</label>
            <input type="date" className={fieldClass} value={draft.reportDeliveredAt} onChange={(e) => set("reportDeliveredAt", e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass}>계약 내용 요약</label>
          <textarea className={fieldClass} rows={3} value={draft.contractSummary} onChange={(e) => set("contractSummary", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>분쟁 내용</label>
          <textarea className={fieldClass} rows={3} value={draft.disputeContent} onChange={(e) => set("disputeContent", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>사실조사 범위</label>
          <textarea className={fieldClass} rows={3} value={draft.investigationScope} onChange={(e) => set("investigationScope", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>주요 조사 결과</label>
          <textarea className={fieldClass} rows={3} value={draft.keyFindings} onChange={(e) => set("keyFindings", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>법적 근거 요약</label>
          <textarea className={fieldClass} rows={3} value={draft.legalBasisSummary} onChange={(e) => set("legalBasisSummary", e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">저장되었습니다.</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </Card>
  );
}
