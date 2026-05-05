export const CUSTOMER_NOTIFICATION_MANUAL_AUDIT_HTTP_METHOD = "POST";
export const CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CHANNEL = "manual";

export const CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CONFIRMATIONS = [
  {
    key: "recipientConfirmed",
    label: "수신자를 확인했습니다."
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
    label: "수동 전달 완료 기록을 진행합니다."
  }
] as const;

export type CustomerNotificationManualAuditConfirmationKey =
  (typeof CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CONFIRMATIONS)[number]["key"];

export type CustomerNotificationManualAuditConfirmations = Record<
  CustomerNotificationManualAuditConfirmationKey,
  boolean
>;

export type CustomerNotificationManualAuditSuccessDto = {
  status: "SENT";
  channel: "manual";
  deliveryMode: "manual_audit_only";
  recipientPreview: string;
  messageVersion: string;
  previewHash: string;
  idempotencyKey: string;
  sentAt: string;
  externalActionAllowed: false;
  providerCalled: false;
  isResend: boolean;
};

export type CustomerNotificationManualAuditResultViewModel = {
  statusLabel: string;
  channelLabel: string;
  deliveryModeLabel: string;
  sentAt: string;
  idempotencyKey: string;
  previewHash: string;
  providerCalledLabel: string;
  externalActionAllowedLabel: string;
  isResendLabel: string;
};

export const CUSTOMER_NOTIFICATION_MANUAL_AUDIT_FORBIDDEN_RENDER_TOKENS = [
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

export function buildCustomerNotificationManualAuditApiPath(input: {
  inquiryId: string;
}) {
  return `/api/admin/inquiries/${encodeURIComponent(input.inquiryId)}/customer-notification/send`;
}

export function createEmptyCustomerNotificationManualAuditConfirmations(): CustomerNotificationManualAuditConfirmations {
  return {
    recipientConfirmed: false,
    trackingCodeConfirmed: false,
    messageContentReviewed: false,
    noSensitiveInternalDataConfirmed: false,
    customerConsentConfirmed: false,
    finalSendConfirmed: false
  };
}

export function areAllCustomerNotificationManualAuditConfirmationsChecked(
  confirmations: CustomerNotificationManualAuditConfirmations
) {
  return CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CONFIRMATIONS.every(
    (item) => confirmations[item.key] === true
  );
}

export function buildCustomerNotificationManualAuditRequest(input: {
  previewHash: string;
  messageVersion: string;
  idempotencyKey: string;
}) {
  return {
    channel: CUSTOMER_NOTIFICATION_MANUAL_AUDIT_CHANNEL,
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

export function buildCustomerNotificationManualAuditSuccessViewModel(
  dto: CustomerNotificationManualAuditSuccessDto
): CustomerNotificationManualAuditResultViewModel {
  return {
    statusLabel: dto.status,
    channelLabel: "수동 전달",
    deliveryModeLabel: dto.deliveryMode,
    sentAt: dto.sentAt,
    idempotencyKey: dto.idempotencyKey,
    previewHash: dto.previewHash,
    providerCalledLabel: dto.providerCalled ? "true" : "false",
    externalActionAllowedLabel: dto.externalActionAllowed ? "true" : "false",
    isResendLabel: dto.isResend ? "true" : "false"
  };
}

export function getCustomerNotificationManualAuditErrorMessage(code: string | undefined) {
  if (code === "DUPLICATE_NOTIFICATION_SEND") {
    return "이미 같은 안내문에 대한 수동 전달 기록이 있습니다.";
  }

  return "수동 전달 완료 기록에 실패했습니다. 상태를 확인한 뒤 다시 시도하세요.";
}
