"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildCustomerNotificationPreviewApiPath,
  buildCustomerNotificationPreviewViewModel,
  CUSTOMER_NOTIFICATION_PREVIEW_HTTP_METHOD,
  type CustomerNotificationPreviewDto,
  type CustomerNotificationPreviewViewModel
} from "@/lib/services/customer-notification-preview-ui-model";
import {
  areAllCustomerNotificationManualAuditConfirmationsChecked,
  buildCustomerNotificationManualAuditApiPath,
  buildCustomerNotificationManualAuditRequest,
  buildCustomerNotificationManualAuditSuccessViewModel,
  createEmptyCustomerNotificationManualAuditConfirmations,
  CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CONFIRMATIONS,
  CUSTOMER_NOTIFICATION_MANUAL_AUDIT_HTTP_METHOD,
  getCustomerNotificationManualAuditErrorMessage,
  type CustomerNotificationManualAuditConfirmations,
  type CustomerNotificationManualAuditResultViewModel,
  type CustomerNotificationManualAuditSuccessDto
} from "@/lib/services/customer-notification-manual-audit-ui-model";

type PreviewLoadState =
  | { status: "idle" | "loading"; preview: CustomerNotificationPreviewViewModel | null }
  | { status: "success"; preview: CustomerNotificationPreviewViewModel }
  | { status: "error"; preview: null };

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; result: CustomerNotificationManualAuditResultViewModel }
  | { status: "error"; message: string };

function makeIdempotencyKey() {
  const now = new Date().toISOString().replace(/[^0-9]/g, "");
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `manual-audit-ui-${now}-${random}`;
}

export function CustomerNotificationManualAuditCard({
  inquiryId
}: {
  inquiryId: string;
}) {
  const [previewState, setPreviewState] = useState<PreviewLoadState>({
    status: "idle",
    preview: null
  });
  const [confirmations, setConfirmations] =
    useState<CustomerNotificationManualAuditConfirmations>(
      createEmptyCustomerNotificationManualAuditConfirmations
    );
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const allConfirmed = useMemo(
    () => areAllCustomerNotificationManualAuditConfirmationsChecked(confirmations),
    [confirmations]
  );
  const preview = previewState.preview;
  const canSubmit =
    allConfirmed &&
    previewState.status === "success" &&
    Boolean(preview?.previewHash && preview.messageVersion) &&
    submitState.status !== "submitting" &&
    submitState.status !== "success";

  useEffect(() => {
    const controller = new AbortController();

    async function loadManualPreview() {
      setPreviewState((current) => ({ status: "loading", preview: current.preview }));

      try {
        const response = await fetch(
          buildCustomerNotificationPreviewApiPath({
            inquiryId,
            channel: "manual"
          }),
          {
            method: CUSTOMER_NOTIFICATION_PREVIEW_HTTP_METHOD,
            cache: "no-store",
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw new Error("manual_preview_load_failed");
        }

        const dto = (await response.json()) as CustomerNotificationPreviewDto;
        setPreviewState({
          status: "success",
          preview: buildCustomerNotificationPreviewViewModel(dto)
        });
      } catch {
        if (controller.signal.aborted) return;
        setPreviewState({ status: "error", preview: null });
      }
    }

    void loadManualPreview();

    return () => controller.abort();
  }, [inquiryId]);

  function toggleConfirmation(key: keyof CustomerNotificationManualAuditConfirmations) {
    if (submitState.status === "success") return;
    setConfirmations((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  async function submitManualAudit() {
    if (!canSubmit || !preview?.previewHash) return;

    const confirmed = window.confirm(
      "실제 발송 없이, 고객에게 수동으로 안내했다고 기록하시겠습니까?"
    );
    if (!confirmed) return;

    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch(
        buildCustomerNotificationManualAuditApiPath({ inquiryId }),
        {
          method: CUSTOMER_NOTIFICATION_MANUAL_AUDIT_HTTP_METHOD,
          headers: {
            "Content-Type": "application/json"
          },
          cache: "no-store",
          body: JSON.stringify(
            buildCustomerNotificationManualAuditRequest({
              previewHash: preview.previewHash,
              messageVersion: preview.messageVersion,
              idempotencyKey: makeIdempotencyKey()
            })
          )
        }
      );

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getCustomerNotificationManualAuditErrorMessage(
            typeof body?.code === "string" ? body.code : undefined
          )
        );
      }

      setSubmitState({
        status: "success",
        result: buildCustomerNotificationManualAuditSuccessViewModel(
          body as CustomerNotificationManualAuditSuccessDto
        )
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "수동 전달 완료 기록에 실패했습니다. 상태를 확인한 뒤 다시 시도하세요."
      });
    }
  }

  return (
    <Card muted className="mt-5 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-kicker">수동 전달 완료 기록</p>
          <div className="mt-2 space-y-1 text-sm text-text-muted">
            <p>이 기능은 실제 문자, 이메일, 알림톡을 발송하지 않습니다.</p>
            <p>관리자가 안내문을 고객에게 별도로 전달한 뒤, 그 사실만 기록합니다.</p>
            <p>기록은 운영 감사용으로 저장됩니다.</p>
          </div>
        </div>
        <Badge className="border-amber-200 bg-amber-50 text-amber-800">manual audit only</Badge>
      </div>

      {previewState.status === "error" ? (
        <Card muted className="mt-5 border-amber-200 bg-amber-50/70 p-4">
          <p className="text-sm font-semibold text-amber-800">
            수동 전달 미리보기를 불러오지 못했습니다.
          </p>
        </Card>
      ) : null}

      {preview ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-medium text-text-muted">수신자 미리보기</p>
              <p className="mt-1 font-semibold text-text-strong">{preview.recipientPreview}</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="text-xs font-medium text-text-muted">메시지 버전</p>
              <p className="mt-1 font-mono text-xs text-text-strong">{preview.messageVersion}</p>
            </div>
          </div>

          <Card muted className="p-4">
            <p className="ui-kicker">수동 전달 안내문</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text">
              {preview.messageText}
            </p>
          </Card>
        </div>
      ) : previewState.status === "loading" ? (
        <p className="mt-5 text-sm text-text-muted">수동 전달 미리보기를 불러오는 중입니다.</p>
      ) : null}

      <div className="mt-5 grid gap-3">
        {CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CONFIRMATIONS.map((item) => (
          <label
            key={item.key}
            className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3 text-sm text-text"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={confirmations[item.key]}
              disabled={submitState.status === "success"}
              onChange={() => toggleConfirmation(item.key)}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="primary"
          onClick={() => void submitManualAudit()}
          disabled={!canSubmit}
        >
          {submitState.status === "submitting" ? "기록 저장 중" : "수동 전달 완료 기록"}
        </Button>
        {!allConfirmed ? (
          <p className="text-sm text-text-muted">확인 항목 6개를 모두 체크하면 기록할 수 있습니다.</p>
        ) : null}
      </div>

      {submitState.status === "success" ? (
        <Card muted className="mt-5 border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-sm font-semibold text-emerald-700">
            수동 전달 완료 기록이 저장되었습니다.
          </p>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-text-muted">providerCalled</p>
              <p className="mt-1 font-semibold text-text-strong">
                {submitState.result.providerCalledLabel}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">externalActionAllowed</p>
              <p className="mt-1 font-semibold text-text-strong">
                {submitState.result.externalActionAllowedLabel}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">sentAt</p>
              <p className="mt-1 font-mono text-xs text-text-strong">{submitState.result.sentAt}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">idempotencyKey</p>
              <p className="mt-1 break-all font-mono text-xs text-text-strong">
                {submitState.result.idempotencyKey}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {submitState.status === "error" ? (
        <Card muted className="mt-5 border-amber-200 bg-amber-50/70 p-4">
          <p className="text-sm font-semibold text-amber-800">{submitState.message}</p>
        </Card>
      ) : null}
    </Card>
  );
}
