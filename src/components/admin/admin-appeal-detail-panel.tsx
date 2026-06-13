"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Card } from "@/components/ui/card";
import { parseClientApiError } from "@/lib/http/client-api";
import { formatDate, stringifyDateForInput } from "@/lib/utils";

type AdminAppealDetailSnapshot = {
  id: string;
  appealType: string;
  disposingAgency: string | null;
  reviewingAgency: string | null;
  dispositionContent: string | null;
  dispositionDate: Date | null;
  noticeReceivedDate: Date | null;
  filingDeadline: Date | null;
  filedAt: Date | null;
  hearingDate: Date | null;
  decisionExpectedDate: Date | null;
  decisionReceivedDate: Date | null;
  result: string;
  resultSummary: string | null;
  groundsSummary: string | null;
  evidenceSummary: string | null;
  caseNoOfficial: string | null;
  verifiedBy: string | null;
  updatedAt: string;
} | null;

type Props = {
  caseMatterId: string;
  caseMatterUpdatedAt: string;
  appealDetail: AdminAppealDetailSnapshot;
};

const APPEAL_TYPES = [
  { value: "ADMINISTRATIVE_APPEAL", label: "행정심판" },
  { value: "ADMINISTRATIVE_LITIGATION", label: "행정소송" },
  { value: "OBJECTION", label: "이의신청" },
  { value: "PETITION", label: "진정" },
];

const RESULTS = [
  { value: "PENDING", label: "진행중" },
  { value: "ACCEPTED", label: "인용" },
  { value: "PARTIALLY_ACCEPTED", label: "일부인용" },
  { value: "REJECTED", label: "기각" },
  { value: "WITHDRAWN", label: "취하" },
  { value: "DISMISSED", label: "각하" },
];

export function AdminAppealDetailPanel({ caseMatterId, appealDetail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [draft, setDraft] = useState({
    appealType: appealDetail?.appealType ?? "ADMINISTRATIVE_APPEAL",
    disposingAgency: appealDetail?.disposingAgency ?? "",
    reviewingAgency: appealDetail?.reviewingAgency ?? "",
    dispositionContent: appealDetail?.dispositionContent ?? "",
    dispositionDate: stringifyDateForInput(appealDetail?.dispositionDate),
    noticeReceivedDate: stringifyDateForInput(appealDetail?.noticeReceivedDate),
    filingDeadline: stringifyDateForInput(appealDetail?.filingDeadline),
    filedAt: stringifyDateForInput(appealDetail?.filedAt),
    hearingDate: stringifyDateForInput(appealDetail?.hearingDate),
    decisionExpectedDate: stringifyDateForInput(appealDetail?.decisionExpectedDate),
    decisionReceivedDate: stringifyDateForInput(appealDetail?.decisionReceivedDate),
    result: appealDetail?.result ?? "PENDING",
    resultSummary: appealDetail?.resultSummary ?? "",
    groundsSummary: appealDetail?.groundsSummary ?? "",
    evidenceSummary: appealDetail?.evidenceSummary ?? "",
    caseNoOfficial: appealDetail?.caseNoOfficial ?? "",
    verifiedBy: appealDetail?.verifiedBy ?? "",
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
        const res = await fetch(`/api/admin/case-matters/${caseMatterId}/admin-appeal-detail`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
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
      <h3 className="text-base font-semibold text-text-strong">행정심판 상세</h3>
      <p className="mt-1 text-xs text-text-muted">청구 유형, 처분 정보, 심판 진행 현황을 기록합니다.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>심판 유형</label>
            <select className={fieldClass} value={draft.appealType} onChange={(e) => set("appealType", e.target.value)}>
              {APPEAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>결과</label>
            <select className={fieldClass} value={draft.result} onChange={(e) => set("result", e.target.value)}>
              {RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>처분청</label>
            <input className={fieldClass} value={draft.disposingAgency} onChange={(e) => set("disposingAgency", e.target.value)} placeholder="예: 서울출입국·외국인청" />
          </div>
          <div>
            <label className={labelClass}>재결청</label>
            <input className={fieldClass} value={draft.reviewingAgency} onChange={(e) => set("reviewingAgency", e.target.value)} placeholder="예: 중앙행정심판위원회" />
          </div>
          <div>
            <label className={labelClass}>공식 사건번호</label>
            <input className={fieldClass} value={draft.caseNoOfficial} onChange={(e) => set("caseNoOfficial", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>처분일</label>
            <input type="date" className={fieldClass} value={draft.dispositionDate} onChange={(e) => set("dispositionDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>처분 통지 수령일</label>
            <input type="date" className={fieldClass} value={draft.noticeReceivedDate} onChange={(e) => set("noticeReceivedDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>청구기한</label>
            <input type="date" className={fieldClass} value={draft.filingDeadline} onChange={(e) => set("filingDeadline", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>실제 청구일</label>
            <input type="date" className={fieldClass} value={draft.filedAt} onChange={(e) => set("filedAt", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>심리기일</label>
            <input type="date" className={fieldClass} value={draft.hearingDate} onChange={(e) => set("hearingDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>재결 예정일</label>
            <input type="date" className={fieldClass} value={draft.decisionExpectedDate} onChange={(e) => set("decisionExpectedDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>재결서 수령일</label>
            <input type="date" className={fieldClass} value={draft.decisionReceivedDate} onChange={(e) => set("decisionReceivedDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>검토자</label>
            <input className={fieldClass} value={draft.verifiedBy} onChange={(e) => set("verifiedBy", e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass}>처분 내용</label>
          <textarea className={fieldClass} rows={3} value={draft.dispositionContent} onChange={(e) => set("dispositionContent", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>청구 이유 요약</label>
          <textarea className={fieldClass} rows={3} value={draft.groundsSummary} onChange={(e) => set("groundsSummary", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>주요 증거 요약</label>
          <textarea className={fieldClass} rows={3} value={draft.evidenceSummary} onChange={(e) => set("evidenceSummary", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>재결 요지</label>
          <textarea className={fieldClass} rows={3} value={draft.resultSummary} onChange={(e) => set("resultSummary", e.target.value)} />
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
