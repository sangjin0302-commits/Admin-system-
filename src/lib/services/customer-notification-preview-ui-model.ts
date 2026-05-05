export const CUSTOMER_NOTIFICATION_PREVIEW_HTTP_METHOD = "GET";

export const CUSTOMER_NOTIFICATION_PREVIEW_CHANNELS = [
  { value: "manual", label: "수동 전달" },
  { value: "email", label: "이메일" },
  { value: "sms", label: "SMS" },
  { value: "alimtalk", label: "알림톡" }
] as const;

export type CustomerNotificationPreviewChannel =
  (typeof CUSTOMER_NOTIFICATION_PREVIEW_CHANNELS)[number]["value"];

export type CustomerNotificationPreviewDto = {
  trackingCode: string | null;
  channel: CustomerNotificationPreviewChannel;
  recipientPreview: string;
  messageText: string | null;
  canSend: false;
  dryRunOnly: true;
  externalActionAllowed: false;
  blockedReasonCodes: string[];
  requiredConfirmations: string[];
  previewHash: string | null;
  messageVersion: string;
};

export type CustomerNotificationPreviewViewModel = {
  trackingCode: string | null;
  channel: CustomerNotificationPreviewChannel;
  channelLabel: string;
  recipientPreview: string;
  messageText: string;
  canSendLabel: string;
  dryRunOnlyLabel: string;
  externalActionAllowedLabel: string;
  blockedReasonLabels: string[];
  requiredConfirmationLabels: string[];
  messageVersion: string;
  previewHash: string;
};

export const CUSTOMER_NOTIFICATION_PREVIEW_FORBIDDEN_RENDER_TOKENS = [
  "inquiryId",
  "caseId",
  "workflowStatus",
  "bridgeWorkflowStatus",
  "Lawbot",
  "approvalGate",
  "reviewSignals",
  "documentDrafts",
  "messageDrafts",
  "communicationLogs",
  "adminNote"
] as const;

const blockedReasonLabels: Record<string, string> = {
  TRACKING_CODE_MISSING: "고객용 접수번호가 없습니다.",
  RECIPIENT_MISSING: "선택한 채널의 수신자 후보가 없습니다.",
  CHANNEL_CONSENT_NOT_CONFIRMED: "SMS/알림톡 채널 동의가 확인되지 않았습니다.",
  CUSTOMER_CONSENT_NOT_CONFIRMED: "개인정보 수집 및 이용 동의가 확인되지 않았습니다.",
  SEND_DISABLED_PREVIEW_ONLY: "현재 단계는 미리보기 전용입니다."
};

const confirmationLabels: Record<string, string> = {
  recipientConfirmed: "수신자 확인",
  trackingCodeConfirmed: "접수번호 확인",
  messageContentReviewed: "안내문 내용 검토",
  noSensitiveInternalDataConfirmed: "내부 정보 미포함 확인",
  customerConsentConfirmed: "고객 동의 확인",
  finalSendConfirmed: "최종 실행 확인"
};

export function buildCustomerNotificationPreviewApiPath(input: {
  inquiryId: string;
  channel: CustomerNotificationPreviewChannel;
}) {
  const inquiryId = encodeURIComponent(input.inquiryId);
  const channel = encodeURIComponent(input.channel);
  return `/api/admin/inquiries/${inquiryId}/customer-notification-preview?channel=${channel}`;
}

export function getCustomerNotificationPreviewChannelLabel(
  channel: CustomerNotificationPreviewChannel
) {
  return CUSTOMER_NOTIFICATION_PREVIEW_CHANNELS.find((item) => item.value === channel)?.label ?? channel;
}

export function buildCustomerNotificationPreviewViewModel(
  dto: CustomerNotificationPreviewDto
): CustomerNotificationPreviewViewModel {
  return {
    trackingCode: dto.trackingCode,
    channel: dto.channel,
    channelLabel: getCustomerNotificationPreviewChannelLabel(dto.channel),
    recipientPreview: dto.recipientPreview || "수신자 후보 없음",
    messageText: dto.messageText || "미리보기 가능한 안내문이 없습니다.",
    canSendLabel: dto.canSend ? "가능" : "불가",
    dryRunOnlyLabel: dto.dryRunOnly ? "true" : "false",
    externalActionAllowedLabel: dto.externalActionAllowed ? "true" : "false",
    blockedReasonLabels:
      dto.blockedReasonCodes.length > 0
        ? dto.blockedReasonCodes.map((code) => blockedReasonLabels[code] ?? code)
        : ["제한 사유 없음"],
    requiredConfirmationLabels:
      dto.requiredConfirmations.length > 0
        ? dto.requiredConfirmations.map((item) => confirmationLabels[item] ?? item)
        : ["확인 항목 없음"],
    messageVersion: dto.messageVersion,
    previewHash: dto.previewHash || "-"
  };
}
