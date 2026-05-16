"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, type FormEvent } from "react";

import { Card } from "@/components/ui/card";
import {
  formatCaseMatterTypeLabel,
  listImmigrationMatterTypeOptions,
  type ImmigrationMatterTypeOption
} from "@/lib/immigration";
import { parseClientApiError } from "@/lib/http/client-api";
import { normalizeInquiryType, type InquiryType } from "@/types/inquiry";

type ExistingCaseMatterSummary = {
  id: string;
  caseNo: string | null;
  title: string;
  matterType: string;
  status: string;
} | null;

type ConversionResult = {
  id: string;
  caseNo: string;
  title: string;
  matterType: string;
  status: string;
  created: boolean;
};

type InquiryCaseConversionPanelProps = {
  inquiryId: string;
  inquiryTitle: string;
  inquiryType: InquiryType;
  latestCaseMatter: ExistingCaseMatterSummary;
};

export function suggestMatterTypeForInquiryType(inquiryType: InquiryType) {
  if (inquiryType === "FOREIGNER_VISA") return "visa_issuance_support";
  if (inquiryType === "IMMIGRATION_STAY") return "residence_status_document_support";
  return "";
}

export function buildInquiryCaseConversionOptions() {
  return listImmigrationMatterTypeOptions();
}

function defaultCaseTitle(title: string) {
  const trimmed = title.trim();
  return trimmed ? trimmed.slice(0, 120) : "";
}

function optionLabel(option: ImmigrationMatterTypeOption) {
  return `${option.label} (${option.value})`;
}

export function InquiryCaseConversionPanel({
  inquiryId,
  inquiryTitle,
  inquiryType,
  latestCaseMatter
}: InquiryCaseConversionPanelProps) {
  const normalizedInquiryType = normalizeInquiryType(inquiryType);
  const options = useMemo(() => buildInquiryCaseConversionOptions(), []);
  const [title, setTitle] = useState(defaultCaseTitle(inquiryTitle));
  const [selectedMatterType, setSelectedMatterType] = useState(
    suggestMatterTypeForInquiryType(normalizedInquiryType)
  );
  const [customMatterType, setCustomMatterType] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [forceCreate, setForceCreate] = useState(false);
  const [updateInquiryStatusToWon, setUpdateInquiryStatusToWon] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const effectiveMatterType = customMatterType.trim() || selectedMatterType.trim();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setResult(null);

    startTransition(async () => {
      const payload = {
        title: title.trim() || undefined,
        matterType: effectiveMatterType || undefined,
        assignedTo: assignedTo.trim() || undefined,
        actorName: "admin",
        forceCreate,
        updateInquiryStatusToWon
      };

      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(inquiryId)}/case-matters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setMessage(await parseClientApiError(response, "사건 전환에 실패했습니다."));
        return;
      }

      const data = await response.json();
      const caseMatter = data?.caseMatter;
      if (!data?.ok || !caseMatter?.id) {
        setMessage("사건 전환 응답을 확인할 수 없습니다.");
        return;
      }

      setResult({
        id: caseMatter.id,
        caseNo: caseMatter.caseNo ?? "-",
        title: caseMatter.title ?? "-",
        matterType: caseMatter.matterType ?? "-",
        status: caseMatter.status ?? "-",
        created: Boolean(data.created)
      });
      setMessage(data.created ? "사건을 생성했습니다." : "기존 사건을 연결했습니다.");
    });
  }

  return (
    <Card muted className="p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="ui-kicker">Case conversion</p>
          <h3 className="text-base font-semibold text-text-strong">사건으로 전환</h3>
          <p className="mt-1 text-sm text-text-muted">
            문의를 CaseMatter로 전환합니다. 출입국·행정심판 유형은 registry label로 고르고, 저장 값은 기존 matterType string을 사용합니다.
          </p>
        </div>
        {latestCaseMatter ? (
          <Link
            href={`/admin/cases/${latestCaseMatter.id}`}
            className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
          >
            기존 사건 보기
          </Link>
        ) : null}
      </div>

      {latestCaseMatter ? (
        <div className="mt-4 rounded-lg border border-line bg-surface p-3 text-sm">
          <p className="font-semibold text-text-strong">{latestCaseMatter.title}</p>
          <p className="mt-1 text-text-muted">
            {latestCaseMatter.caseNo ?? "-"} / {formatCaseMatterTypeLabel(latestCaseMatter.matterType)} /{" "}
            {latestCaseMatter.status}
          </p>
        </div>
      ) : null}

      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <label className="space-y-1 text-sm font-medium text-text">
          사건명
          <input
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
          />
        </label>

        <div className="grid gap-3 lg:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-text">
            출입국·행정심판 matterType
            <select
              value={selectedMatterType}
              onChange={(event) => setSelectedMatterType(event.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            >
              <option value="">backend 추론 사용</option>
              <optgroup label="출입국·행정심판">
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {optionLabel(option)}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium text-text">
            기타/직접 입력 matterType
            <input
              value={customMatterType}
              maxLength={80}
              placeholder="기존 matterType string 유지 필요 시 입력"
              onChange={(event) => setCustomMatterType(event.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            />
          </label>
        </div>

        <label className="max-w-sm space-y-1 text-sm font-medium text-text">
          담당자
          <input
            value={assignedTo}
            maxLength={80}
            onChange={(event) => setAssignedTo(event.target.value)}
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
          />
        </label>

        <div className="grid gap-2 text-sm text-text md:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
            <input
              type="checkbox"
              checked={forceCreate}
              onChange={(event) => setForceCreate(event.target.checked)}
            />
            기존 사건이 있어도 새 사건 생성
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
            <input
              type="checkbox"
              checked={updateInquiryStatusToWon}
              onChange={(event) => setUpdateInquiryStatusToWon(event.target.checked)}
            />
            문의 상태를 수임으로 변경
          </label>
        </div>

        <p className="text-xs text-text-muted">
          문서 자동작성, 기관 제출, 고객 발송은 수행하지 않습니다. 전환 후 사건 상세에서 관리자 검토를 진행하세요.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
          >
            사건으로 전환
          </button>
          {message ? <p className="text-sm text-text-muted">{message}</p> : null}
        </div>
      </form>

      {result ? (
        <div className="mt-4 rounded-lg border border-line bg-surface p-3 text-sm">
          <p className="font-semibold text-text-strong">{result.title}</p>
          <p className="mt-1 text-text-muted">
            {result.caseNo} / {formatCaseMatterTypeLabel(result.matterType)} / {result.status}
          </p>
          <Link
            href={`/admin/cases/${result.id}`}
            className="mt-3 inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
          >
            생성된 사건 보기
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
