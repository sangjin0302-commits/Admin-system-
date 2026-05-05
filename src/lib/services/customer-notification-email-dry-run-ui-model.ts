export const CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_HTTP_METHOD = "POST";
export const CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_CHANNEL = "email";

export const CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_CONFIRMATIONS = [
  {
    key: "recipientConfirmed",
    label: "이메일 수신자를 확인했습니다."
  },
  {
    key: "trackingCodeConfirmed",
    label: "접수번호를 확인했습니다."
  },
  {
    key: "messageContentReviewed",
    label: "안내문 내용을 확인했습니다."
  },
  {
    key: "noSensitiveInternalDataConfirmed",
    label: "내부 정보가 포함되지 않았음을 확인했습니다."
  },
  {
    key: "customerConsentConfirmed",
    label: "고객 안내 목적 및 동의 범위를 확인했습니다."
  },
  {
    key: "finalSendConfirmed",
    label: "이메일 발송 준비 기록을 진행합니다."
  }
] as const;

export type CustomerNotificationEmailDryRunConfirmationKey =
  (typeof CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_CONFIRMATIONS)[number]["key"];

export type CustomerNotificationEmailDryRunConfirmations = Record<
  CustomerNotificationEmailDryRunConfirmationKey,
  boolean
>;

export type CustomerNotificationEmailDryRunSuccessDto = {
  status: "DRY_RUN_RECORDED";
  channel: "email";
  deliveryMode: "email_dry_run_only";
  recipientPreview: string;
  providerName: "dry-run";
  providerCalled: false;
  dryRunOnly: true;
  externalActionAllowed: false;
  messageVersion: string;
  previewHash: string;
  idempotencyKey: string;
  recordedAt?: string;
  sentAt?: string;
  isResend: boolean;
};

export type CustomerNotificationEmailDryRunResultViewModel = {
  statusLabel: string;
  channelLabel: string;
  deliveryModeLabel: string;
  providerName: string;
  providerCalledLabel: string;
  dryRunOnlyLabel: string;
  externalActionAllowedLabel: string;
  recordedAt: string;
  idempotencyKey: string;
  previewHash: string;
  isResendLabel: string;
};

export const CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_FORBIDDEN_RENDER_TOKENS = [
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

export function buildCustomerNotificationEmailDryRunApiPath(input: {
  inquiryId: string;
}) {
  return `/api/admin/inquiries/${encodeURIComponent(input.inquiryId)}/customer-notification/send`;
}

export function createEmptyCustomerNotificationEmailDryRunConfirmations(): CustomerNotificationEmailDryRunConfirmations {
  return {
    recipientConfirmed: false,
    trackingCodeConfirmed: false,
    messageContentReviewed: false,
    noSensitiveInternalDataConfirmed: false,
    customerConsentConfirmed: false,
    finalSendConfirmed: false
  };
}

export function areAllCustomerNotificationEmailDryRunConfirmationsChecked(
  confirmations: CustomerNotificationEmailDryRunConfirmations
) {
  return CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_CONFIRMATIONS.every(
    (item) => confirmations[item.key] === true
  );
}

export function buildCustomerNotificationEmailDryRunRequest(input: {
  previewHash: string;
  messageVersion: string;
  idempotencyKey: string;
}) {
  return {
    channel: CUSTOMER_NOTIFICATION_EMAIL_DRY_RUN_CHANNEL,
    previewHash: input.previewHash,
    messageVersion: input.messageVersion,
    idempotencyKey: input.idempotencyKey,
    confirmations: {
      recipientConfirmed: true,
      trackingCodeConfirmed: true,
      messageContentReviewed: true,
      noSensitiveInternalDataConfirmed: true,
      customerConsentConfirmed: true,
      finalSendConfirmed: true
    }
  };
}

export function buildCustomerNotificationEmailDryRunSuccessViewModel(
  dto: CustomerNotificationEmailDryRunSuccessDto
): CustomerNotificationEmailDryRunResultViewModel {
  return {
    statusLabel: dto.status,
    channelLabel: "이메일",
    deliveryModeLabel: dto.deliveryMode,
    providerName: dto.providerName,
    providerCalledLabel: dto.providerCalled ? "true" : "false",
    dryRunOnlyLabel: dto.dryRunOnly ? "true" : "false",
    externalActionAllowedLabel: dto.externalActionAllowed ? "true" : "false",
    recordedAt: dto.recordedAt ?? dto.sentAt ?? "-",
    idempotencyKey: dto.idempotencyKey,
    previewHash: dto.previewHash,
    isResendLabel: dto.isResend ? "true" : "false"
  };
}

export function getCustomerNotificationEmailDryRunErrorMessage(code: string | undefined) {
  if (code === "DUPLICATE_NOTIFICATION_SEND") {
    return "이미 같은 이메일 안내문에 대한 준비 기록이 있습니다.";
  }

  return "이메일 발송 준비 기록에 실패했습니다. 상태를 확인한 뒤 다시 시도하세요.";
}
