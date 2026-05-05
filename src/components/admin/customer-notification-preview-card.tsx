"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildCustomerNotificationPreviewApiPath,
  buildCustomerNotificationPreviewViewModel,
  CUSTOMER_NOTIFICATION_PREVIEW_CHANNELS,
  CUSTOMER_NOTIFICATION_PREVIEW_HTTP_METHOD,
  type CustomerNotificationPreviewChannel,
  type CustomerNotificationPreviewDto,
  type CustomerNotificationPreviewViewModel
} from "@/lib/services/customer-notification-preview-ui-model";

type LoadState =
  | { status: "idle" | "loading"; preview: CustomerNotificationPreviewViewModel | null }
  | { status: "success"; preview: CustomerNotificationPreviewViewModel }
  | { status: "error"; preview: null };

function BooleanBadge({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "safe" | "blocked";
}) {
  const className =
    tone === "safe"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <Badge className={`mt-2 ${className}`}>{value}</Badge>
    </div>
  );
}

export function CustomerNotificationPreviewCard({
  inquiryId
}: {
  inquiryId: string;
}) {
  const [channel, setChannel] = useState<CustomerNotificationPreviewChannel>("manual");
  const [loadState, setLoadState] = useState<LoadState>({
    status: "idle",
    preview: null
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreview() {
      setLoadState((current) => ({ status: "loading", preview: current.preview }));

      try {
        const response = await fetch(
          buildCustomerNotificationPreviewApiPath({ inquiryId, channel }),
          {
            method: CUSTOMER_NOTIFICATION_PREVIEW_HTTP_METHOD,
            cache: "no-store",
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw new Error("preview_load_failed");
        }

        const dto = (await response.json()) as CustomerNotificationPreviewDto;
        setLoadState({
          status: "success",
          preview: buildCustomerNotificationPreviewViewModel(dto)
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadState({ status: "error", preview: null });
      }
    }

    void loadPreview();

    return () => controller.abort();
  }, [channel, inquiryId]);

  const preview = loadState.preview;

  return (
    <Card muted className="mt-5 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-kicker">고객 알림 미리보기</p>
          <p className="mt-2 text-sm text-text-muted">
            실제 발송 없이 채널별 안내문과 수신자 정보를 확인합니다.
          </p>
          <div className="mt-3 space-y-1 text-sm text-text-muted">
            <p>이 미리보기는 실제 발송을 실행하지 않습니다.</p>
            <p>현재 단계에서는 발송 버튼이 제공되지 않습니다.</p>
            <p>SMS/알림톡은 별도 채널 동의 확인 전까지 발송할 수 없습니다.</p>
          </div>
        </div>
        <Badge className="border-amber-200 bg-amber-50 text-amber-800">미리보기 전용</Badge>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="고객 알림 채널 선택">
        {CUSTOMER_NOTIFICATION_PREVIEW_CHANNELS.map((item) => (
          <Button
            key={item.value}
            type="button"
            variant={channel === item.value ? "primary" : "secondary"}
            size="sm"
            onClick={() => setChannel(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {loadState.status === "error" ? (
        <Card muted className="mt-5 border-amber-200 bg-amber-50/70 p-4">
          <p className="text-sm font-semibold text-amber-800">
            알림 미리보기를 불러오지 못했습니다.
          </p>
        </Card>
      ) : null}

      {preview ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <BooleanBadge label="발송 가능 여부" value={preview.canSendLabel} tone="blocked" />
            <BooleanBadge label="미리보기 전용" value={preview.dryRunOnlyLabel} tone="safe" />
            <BooleanBadge
              label="외부 실행 허용"
              value={preview.externalActionAllowedLabel}
              tone="blocked"
            />
          </div>

          <div className="grid gap-4 text-sm text-text md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-text-muted">채널</p>
              <p className="mt-1 font-semibold text-text-strong">{preview.channelLabel}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">수신자 미리보기</p>
              <p className="mt-1 font-semibold text-text-strong">{preview.recipientPreview}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">메시지 버전</p>
              <p className="mt-1 font-mono text-xs text-text-strong">{preview.messageVersion}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">미리보기 해시</p>
              <p className="mt-1 break-all font-mono text-xs text-text-strong">{preview.previewHash}</p>
            </div>
          </div>

          <Card muted className="p-4">
            <p className="ui-kicker">안내문 미리보기</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text">{preview.messageText}</p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card muted className="p-4">
              <p className="ui-kicker">제한 사유</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text">
                {preview.blockedReasonLabels.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
            <Card muted className="p-4">
              <p className="ui-kicker">발송 전 확인 항목</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text">
                {preview.requiredConfirmationLabels.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      ) : loadState.status === "loading" ? (
        <p className="mt-5 text-sm text-text-muted">알림 미리보기를 불러오는 중입니다.</p>
      ) : null}
    </Card>
  );
}
