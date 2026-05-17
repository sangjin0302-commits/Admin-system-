"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Card } from "@/components/ui/card";
import { parseClientApiError } from "@/lib/http/client-api";
import { formatDate, stringifyDateForInput } from "@/lib/utils";

type ImmigrationCaseDetailSnapshot = {
  id: string;
  dispositionType: string | null;
  dispositionDate: Date | null;
  noticeDate: Date | null;
  serviceDate: Date | null;
  appealDeadline: Date | null;
  departureDeadline: Date | null;
  detentionStartDate: Date | null;
  stayExpiryDate: Date | null;
  submissionDeadline: Date | null;
  supplementDeadline: Date | null;
  resultExpectedDate: Date | null;
  nationality: string | null;
  currentStayStatus: string | null;
  familyInKoreaSummary: string | null;
  residenceBaseSummary: string | null;
  employmentOrSchoolSummary: string | null;
  violationHistorySummary: string | null;
  scopeReviewRequired: boolean;
  attorneyScopeRisk: boolean;
  officialFormCheckRequired: boolean;
  deadlineVerifiedAt: Date | null;
  verifiedBy: string | null;
  updatedAt: string;
} | null;

type Draft = {
  dispositionType: string;
  dispositionDate: string;
  noticeDate: string;
  serviceDate: string;
  appealDeadline: string;
  departureDeadline: string;
  detentionStartDate: string;
  stayExpiryDate: string;
  submissionDeadline: string;
  supplementDeadline: string;
  resultExpectedDate: string;
  nationality: string;
  currentStayStatus: string;
  familyInKoreaSummary: string;
  residenceBaseSummary: string;
  employmentOrSchoolSummary: string;
  violationHistorySummary: string;
  scopeReviewRequired: boolean;
  attorneyScopeRisk: boolean;
  officialFormCheckRequired: boolean;
  syncCaseMatterDueDate: boolean;
  deadlineVerifiedAt: string;
  verifiedBy: string;
};

type ImmigrationCaseDetailPanelProps = {
  caseMatterId: string;
  caseMatterUpdatedAt: string;
  immigrationDetail: ImmigrationCaseDetailSnapshot;
};

const dateFields: Array<{
  key: keyof Pick<
    Draft,
    | "dispositionDate"
    | "noticeDate"
    | "serviceDate"
    | "appealDeadline"
    | "departureDeadline"
    | "detentionStartDate"
    | "stayExpiryDate"
    | "submissionDeadline"
    | "supplementDeadline"
    | "resultExpectedDate"
  >;
  label: string;
}> = [
  { key: "dispositionDate", label: "처분일" },
  { key: "noticeDate", label: "통지일" },
  { key: "serviceDate", label: "송달일" },
  { key: "appealDeadline", label: "불복/신청 기한" },
  { key: "departureDeadline", label: "출국기한" },
  { key: "detentionStartDate", label: "보호 개시일" },
  { key: "stayExpiryDate", label: "체류기간 만료일" },
  { key: "submissionDeadline", label: "제출기한" },
  { key: "supplementDeadline", label: "보완기한" },
  { key: "resultExpectedDate", label: "결과 예상일" }
];

function draftFromDetail(detail: ImmigrationCaseDetailSnapshot): Draft {
  return {
    dispositionType: detail?.dispositionType ?? "",
    dispositionDate: stringifyDateForInput(detail?.dispositionDate ?? null),
    noticeDate: stringifyDateForInput(detail?.noticeDate ?? null),
    serviceDate: stringifyDateForInput(detail?.serviceDate ?? null),
    appealDeadline: stringifyDateForInput(detail?.appealDeadline ?? null),
    departureDeadline: stringifyDateForInput(detail?.departureDeadline ?? null),
    detentionStartDate: stringifyDateForInput(detail?.detentionStartDate ?? null),
    stayExpiryDate: stringifyDateForInput(detail?.stayExpiryDate ?? null),
    submissionDeadline: stringifyDateForInput(detail?.submissionDeadline ?? null),
    supplementDeadline: stringifyDateForInput(detail?.supplementDeadline ?? null),
    resultExpectedDate: stringifyDateForInput(detail?.resultExpectedDate ?? null),
    nationality: detail?.nationality ?? "",
    currentStayStatus: detail?.currentStayStatus ?? "",
    familyInKoreaSummary: detail?.familyInKoreaSummary ?? "",
    residenceBaseSummary: detail?.residenceBaseSummary ?? "",
    employmentOrSchoolSummary: detail?.employmentOrSchoolSummary ?? "",
    violationHistorySummary: detail?.violationHistorySummary ?? "",
    scopeReviewRequired: detail?.scopeReviewRequired ?? true,
    attorneyScopeRisk: detail?.attorneyScopeRisk ?? false,
    officialFormCheckRequired: detail?.officialFormCheckRequired ?? true,
    syncCaseMatterDueDate: false,
    deadlineVerifiedAt: stringifyDateForInput(detail?.deadlineVerifiedAt ?? null),
    verifiedBy: detail?.verifiedBy ?? ""
  };
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function nullableDate(value: string) {
  return value || null;
}

function displayDate(value: Date | null | undefined) {
  return formatDate(value ?? null);
}

export function ImmigrationCaseDetailPanel({
  caseMatterId,
  caseMatterUpdatedAt,
  immigrationDetail
}: ImmigrationCaseDetailPanelProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => draftFromDetail(immigrationDetail));
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function setField(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/case-matters/${caseMatterId}/immigration-detail`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dispositionType: nullableText(draft.dispositionType),
          dispositionDate: nullableDate(draft.dispositionDate),
          noticeDate: nullableDate(draft.noticeDate),
          serviceDate: nullableDate(draft.serviceDate),
          appealDeadline: nullableDate(draft.appealDeadline),
          departureDeadline: nullableDate(draft.departureDeadline),
          detentionStartDate: nullableDate(draft.detentionStartDate),
          stayExpiryDate: nullableDate(draft.stayExpiryDate),
          submissionDeadline: nullableDate(draft.submissionDeadline),
          supplementDeadline: nullableDate(draft.supplementDeadline),
          resultExpectedDate: nullableDate(draft.resultExpectedDate),
          nationality: nullableText(draft.nationality),
          currentStayStatus: nullableText(draft.currentStayStatus),
          familyInKoreaSummary: nullableText(draft.familyInKoreaSummary),
          residenceBaseSummary: nullableText(draft.residenceBaseSummary),
          employmentOrSchoolSummary: nullableText(draft.employmentOrSchoolSummary),
          violationHistorySummary: nullableText(draft.violationHistorySummary),
          scopeReviewRequired: draft.scopeReviewRequired,
          attorneyScopeRisk: draft.attorneyScopeRisk,
          officialFormCheckRequired: draft.officialFormCheckRequired,
          syncCaseMatterDueDate: draft.syncCaseMatterDueDate,
          deadlineVerifiedAt: nullableDate(draft.deadlineVerifiedAt),
          verifiedBy: nullableText(draft.verifiedBy),
          actorName: "Admin",
          expectedUpdatedAt: immigrationDetail?.updatedAt,
          expectedCaseUpdatedAt: immigrationDetail ? undefined : caseMatterUpdatedAt
        })
      });

      if (!response.ok) {
        setMessage(await parseClientApiError(response, "출입국 세부정보를 저장하지 못했습니다."));
        if (response.status === 409) {
          router.refresh();
        }
        return;
      }

      const result = (await response.json().catch(() => null)) as { ok?: boolean } | null;
      if (!result?.ok) {
        setMessage("출입국 세부정보 저장 응답을 확인하지 못했습니다.");
        return;
      }

      setMessage("출입국 세부정보를 저장했습니다. 최신 상태를 다시 불러옵니다.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-kicker">Immigration detail</p>
          <h3 className="text-lg font-semibold text-text-strong">출입국 세부정보</h3>
          <p className="mt-1 text-sm text-text-muted">
            출입국 사건의 처분, 기한, 체류 상태, 생활기반 요약을 관리자 전용으로 기록합니다.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm">
          <p className="text-xs text-text-muted">최근 저장</p>
          <p className="font-semibold text-text-strong">{displayDate(immigrationDetail?.updatedAt ? new Date(immigrationDetail.updatedAt) : null)}</p>
        </div>
      </div>

      {!immigrationDetail && (
        <div className="mt-4 rounded-lg border border-dashed border-line bg-surface-muted p-3 text-sm text-text-muted">
          아직 저장된 출입국 세부정보가 없습니다. 아래 항목을 확인한 뒤 필요한 값만 저장하세요.
        </div>
      )}

      <div className="mt-4 grid gap-2 rounded-lg border border-line bg-surface-muted p-3 text-sm lg:grid-cols-2">
        <p>여권번호, 외국인등록번호, 상세 주소 등 고유식별정보는 이 화면에 저장하지 않습니다.</p>
        <p>처분서 원문, 송달일, 관할기관 기준으로 기한을 수동 확인하세요.</p>
        <p>이 화면은 관리자 전용 기록이며, 고객 발송 또는 기관 제출 자동화가 아닙니다.</p>
        <p>체크한 경우에만 CaseMatter dueDate에 반영합니다.</p>
      </div>

      <form className="mt-5 space-y-5" onSubmit={onSubmit}>
        <section>
          <h4 className="text-sm font-semibold text-text-strong">처분/기한</h4>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <label className="text-sm">
              <span className="text-xs font-medium text-text-muted">처분 유형</span>
              <input
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                value={draft.dispositionType}
                maxLength={80}
                onChange={(event) => setField({ dispositionType: event.target.value })}
                placeholder="예: VISA_ISSUANCE_SUPPORT"
              />
            </label>
            {dateFields.map((field) => (
              <label key={field.key} className="text-sm">
                <span className="text-xs font-medium text-text-muted">{field.label}</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                  value={draft[field.key]}
                  onChange={(event) => setField({ [field.key]: event.target.value })}
                />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-text-strong">체류/생활기반 요약</h4>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <label className="text-sm">
              <span className="text-xs font-medium text-text-muted">국적</span>
              <input
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                value={draft.nationality}
                maxLength={80}
                onChange={(event) => setField({ nationality: event.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="text-xs font-medium text-text-muted">현재 체류자격</span>
              <input
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                value={draft.currentStayStatus}
                maxLength={120}
                onChange={(event) => setField({ currentStayStatus: event.target.value })}
              />
            </label>
            {[
              ["familyInKoreaSummary", "국내 가족관계 요약"],
              ["residenceBaseSummary", "국내 생활기반 요약"],
              ["employmentOrSchoolSummary", "직장/학교/사업장 요약"],
              ["violationHistorySummary", "위반/범칙 이력 요약"]
            ].map(([key, label]) => (
              <label key={key} className="text-sm">
                <span className="text-xs font-medium text-text-muted">{label}</span>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                  value={draft[key as keyof Draft] as string}
                  maxLength={500}
                  onChange={(event) => setField({ [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-text-strong">검토/안전 체크</h4>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {[
              ["scopeReviewRequired", "행정사 업무범위 확인 필요"],
              ["attorneyScopeRisk", "변호사 업무 가능성 체크"],
              ["officialFormCheckRequired", "최신 공식 서식 확인 필요"]
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft[key as keyof Draft] as boolean}
                  onChange={(event) => setField({ [key]: event.target.checked })}
                />
                <span>{label}</span>
              </label>
            ))}
            <label className="text-sm">
              <span className="text-xs font-medium text-text-muted">기한 확인일</span>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                value={draft.deadlineVerifiedAt}
                onChange={(event) => setField({ deadlineVerifiedAt: event.target.value })}
              />
            </label>
            <label className="text-sm lg:col-span-2">
              <span className="text-xs font-medium text-text-muted">확인자</span>
              <input
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                value={draft.verifiedBy}
                maxLength={80}
                onChange={(event) => setField({ verifiedBy: event.target.value })}
              />
            </label>
            <label className="rounded-lg border border-line bg-surface px-3 py-2 text-sm lg:col-span-3">
              <span className="flex items-center gap-2 font-medium text-text-strong">
                <input
                  type="checkbox"
                  checked={draft.syncCaseMatterDueDate}
                  onChange={(event) => setField({ syncCaseMatterDueDate: event.target.checked })}
                />
                <span>선택한 핵심 기한을 사건 dueDate에 반영</span>
              </span>
              <span className="mt-2 block text-xs text-text-muted">
                체크하면 불복기한, 출국기한, 보완기한, 체류기간 만료일, 제출기한 순서로 가장 중요한 날짜를 사건 dueDate에 반영합니다.
                처분서 원문과 송달일을 확인한 뒤 사용하세요.
              </span>
            </label>
          </div>
        </section>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-text-strong px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "저장 중" : "출입국 세부정보 저장"}
          </button>
          {message && <p className="text-sm text-text-muted">{message}</p>}
        </div>
      </form>
    </Card>
  );
}
