"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Card } from "@/components/ui/card";
import { parseClientApiError } from "@/lib/http/client-api";
import { stringifyDateForInput } from "@/lib/utils";

type LicenseDetailSnapshot = {
  id: string;
  permitType: string;
  targetAgency: string | null;
  applicationNo: string | null;
  businessName: string | null;
  businessAddress: string | null;
  applicationDate: Date | null;
  reviewDeadline: Date | null;
  approvalDate: Date | null;
  expiryDate: Date | null;
  stage: string;
  requirementsSummary: string | null;
  missingRequirements: string | null;
  supplementContent: string | null;
  supplementDueDate: Date | null;
  conditionsSummary: string | null;
  updatedAt: string;
} | null;

type Props = {
  caseMatterId: string;
  caseMatterUpdatedAt: string;
  licenseDetail: LicenseDetailSnapshot;
};

const PERMIT_TYPES = [
  { value: "BUSINESS_LICENSE", label: "사업허가" },
  { value: "CONSTRUCTION_PERMIT", label: "건축허가" },
  { value: "FOOD_SERVICE_LICENSE", label: "식품영업허가" },
  { value: "MEDICAL_LICENSE", label: "의료업허가" },
  { value: "FOREIGNER_EMPLOYMENT", label: "외국인 고용허가" },
  { value: "TELECOM_LICENSE", label: "통신사업허가" },
  { value: "ENVIRONMENT_PERMIT", label: "환경관련 허가" },
  { value: "OTHER", label: "기타" },
];

const STAGES = [
  { value: "CONSULTATION", label: "사전 상담" },
  { value: "DOCUMENT_PREP", label: "서류 준비" },
  { value: "APPLICATION_FILED", label: "신청 접수" },
  { value: "UNDER_REVIEW", label: "심사 중" },
  { value: "SUPPLEMENT_REQUESTED", label: "보완 요청" },
  { value: "APPROVED", label: "허가" },
  { value: "REJECTED", label: "불허" },
  { value: "APPEALING", label: "불복 진행" },
  { value: "COMPLETED", label: "완료" },
];

export function LicenseDetailPanel({ caseMatterId, licenseDetail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [draft, setDraft] = useState({
    permitType: licenseDetail?.permitType ?? "OTHER",
    targetAgency: licenseDetail?.targetAgency ?? "",
    applicationNo: licenseDetail?.applicationNo ?? "",
    businessName: licenseDetail?.businessName ?? "",
    businessAddress: licenseDetail?.businessAddress ?? "",
    applicationDate: stringifyDateForInput(licenseDetail?.applicationDate),
    reviewDeadline: stringifyDateForInput(licenseDetail?.reviewDeadline),
    approvalDate: stringifyDateForInput(licenseDetail?.approvalDate),
    expiryDate: stringifyDateForInput(licenseDetail?.expiryDate),
    stage: licenseDetail?.stage ?? "CONSULTATION",
    requirementsSummary: licenseDetail?.requirementsSummary ?? "",
    missingRequirements: licenseDetail?.missingRequirements ?? "",
    supplementContent: licenseDetail?.supplementContent ?? "",
    supplementDueDate: stringifyDateForInput(licenseDetail?.supplementDueDate),
    conditionsSummary: licenseDetail?.conditionsSummary ?? "",
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
        const res = await fetch(`/api/admin/case-matters/${caseMatterId}/license-detail`, {
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
      <h3 className="text-base font-semibold text-text-strong">인허가 상세</h3>
      <p className="mt-1 text-xs text-text-muted">허가 유형, 신청 정보, 심사 진행 현황을 기록합니다.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>허가 유형</label>
            <select className={fieldClass} value={draft.permitType} onChange={(e) => set("permitType", e.target.value)}>
              {PERMIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>진행 단계</label>
            <select className={fieldClass} value={draft.stage} onChange={(e) => set("stage", e.target.value)}>
              {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>허가 관청</label>
            <input className={fieldClass} value={draft.targetAgency} onChange={(e) => set("targetAgency", e.target.value)} placeholder="예: 서울특별시청" />
          </div>
          <div>
            <label className={labelClass}>접수번호</label>
            <input className={fieldClass} value={draft.applicationNo} onChange={(e) => set("applicationNo", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>사업체명</label>
            <input className={fieldClass} value={draft.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>사업장 소재지</label>
            <input className={fieldClass} value={draft.businessAddress} onChange={(e) => set("businessAddress", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>신청일</label>
            <input type="date" className={fieldClass} value={draft.applicationDate} onChange={(e) => set("applicationDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>처리기한</label>
            <input type="date" className={fieldClass} value={draft.reviewDeadline} onChange={(e) => set("reviewDeadline", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>허가일</label>
            <input type="date" className={fieldClass} value={draft.approvalDate} onChange={(e) => set("approvalDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>유효기간 만료일</label>
            <input type="date" className={fieldClass} value={draft.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>보완 기한</label>
            <input type="date" className={fieldClass} value={draft.supplementDueDate} onChange={(e) => set("supplementDueDate", e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass}>허가 요건 요약</label>
          <textarea className={fieldClass} rows={3} value={draft.requirementsSummary} onChange={(e) => set("requirementsSummary", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>미충족 요건</label>
          <textarea className={fieldClass} rows={3} value={draft.missingRequirements} onChange={(e) => set("missingRequirements", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>보완 요청 내용</label>
          <textarea className={fieldClass} rows={3} value={draft.supplementContent} onChange={(e) => set("supplementContent", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>허가 조건</label>
          <textarea className={fieldClass} rows={2} value={draft.conditionsSummary} onChange={(e) => set("conditionsSummary", e.target.value)} />
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
