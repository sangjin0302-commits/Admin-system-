import { CUSTOMER_TRACKING_NOTICE_TRACK_URL } from "@/lib/services/customer-tracking-notice-template";
import {
  parseCustomerEmailProviderConfig,
  type CustomerEmailProviderConfigEnv
} from "@/lib/services/customer-email-provider-config";
import { createDisabledResendCustomerEmailProvider } from "@/lib/services/customer-email-resend-provider";

export const CUSTOMER_EMAIL_PROVIDER_DRY_RUN_NAME = "dry-run";

export const CUSTOMER_EMAIL_MESSAGE_VERSION = "tracking-notice-email-v1";

export type CustomerEmailProviderStatus =
  | "DRY_RUN_ACCEPTED"
  | "SENT"
  | "FAILED";

export type CustomerEmailProviderInput = {
  to: string;
  from: string;
  replyTo?: string | null;
  subject: string;
  text: string;
  html?: string | null;
  idempotencyKey: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type CustomerEmailProviderResult = {
  providerName: typeof CUSTOMER_EMAIL_PROVIDER_DRY_RUN_NAME | string;
  providerCalled: boolean;
  dryRunOnly: boolean;
  externalActionAllowed: boolean;
  messageId?: string;
  status: CustomerEmailProviderStatus;
  failureReasonCode?: string;
};

export type CustomerEmailProvider = {
  sendEmail(input: CustomerEmailProviderInput): Promise<CustomerEmailProviderResult>;
};

export type CustomerTrackingEmailMessageInput = {
  trackingCode: string;
  officeName?: string;
  trackUrl?: string;
};

export type CustomerTrackingEmailMessage = {
  subject: string;
  text: string;
  html: string;
  messageVersion: typeof CUSTOMER_EMAIL_MESSAGE_VERSION;
};

export class CustomerEmailProviderValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CustomerEmailProviderValidationError";
    this.code = code;
  }
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeCustomerEmailAddress(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized || null;
}

export function isValidCustomerEmailAddress(value: string | null | undefined) {
  const normalized = normalizeCustomerEmailAddress(value);
  if (!normalized) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function validateCustomerEmailProviderInput(input: CustomerEmailProviderInput) {
  if (!isValidCustomerEmailAddress(input.to)) {
    throw new CustomerEmailProviderValidationError(
      "INVALID_RECIPIENT_EMAIL",
      "Recipient email is invalid."
    );
  }

  if (!isValidCustomerEmailAddress(input.from)) {
    throw new CustomerEmailProviderValidationError(
      "INVALID_SENDER_EMAIL",
      "Sender email is invalid."
    );
  }

  if (hasText(input.replyTo) && !isValidCustomerEmailAddress(input.replyTo)) {
    throw new CustomerEmailProviderValidationError(
      "INVALID_REPLY_TO_EMAIL",
      "Reply-to email is invalid."
    );
  }

  if (!hasText(input.idempotencyKey)) {
    throw new CustomerEmailProviderValidationError(
      "IDEMPOTENCY_KEY_MISSING",
      "Email idempotency key is required."
    );
  }

  if (!hasText(input.subject)) {
    throw new CustomerEmailProviderValidationError(
      "EMAIL_SUBJECT_MISSING",
      "Email subject is required."
    );
  }

  if (!hasText(input.text)) {
    throw new CustomerEmailProviderValidationError(
      "EMAIL_BODY_MISSING",
      "Email body is required."
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCustomerTrackingEmailMessage(
  input: CustomerTrackingEmailMessageInput
): CustomerTrackingEmailMessage {
  const trackingCode = input.trackingCode.trim().toUpperCase();
  if (!trackingCode) {
    throw new CustomerEmailProviderValidationError(
      "TRACKING_CODE_MISSING",
      "Tracking code is required."
    );
  }

  const trackUrl = input.trackUrl?.trim() || CUSTOMER_TRACKING_NOTICE_TRACK_URL;
  const officeName = input.officeName?.trim() || "행정사 사무소";
  const subject = "접수 진행상황 확인 안내";
  const text = [
    `${officeName}입니다.`,
    "",
    "접수가 완료되었습니다. 담당자가 확인 후 연락드리겠습니다.",
    "",
    `접수번호: ${trackingCode}`,
    `진행상황 확인: ${trackUrl}`,
    "",
    "접수번호와 접수 시 남겨주신 휴대폰 번호 뒤 4자리로 진행상황을 조회할 수 있습니다.",
    "휴대폰 홈 화면에 추가하면 접수 진행상황을 앱처럼 빠르게 확인할 수 있습니다."
  ].join("\n");

  const html = [
    `<p>${escapeHtml(officeName)}입니다.</p>`,
    "<p>접수가 완료되었습니다. 담당자가 확인 후 연락드리겠습니다.</p>",
    `<p><strong>접수번호:</strong> ${escapeHtml(trackingCode)}</p>`,
    `<p><strong>진행상황 확인:</strong> <a href="${escapeHtml(trackUrl)}">${escapeHtml(trackUrl)}</a></p>`,
    "<p>접수번호와 접수 시 남겨주신 휴대폰 번호 뒤 4자리로 진행상황을 조회할 수 있습니다.</p>",
    "<p>휴대폰 홈 화면에 추가하면 접수 진행상황을 앱처럼 빠르게 확인할 수 있습니다.</p>"
  ].join("");

  return {
    subject,
    text,
    html,
    messageVersion: CUSTOMER_EMAIL_MESSAGE_VERSION
  };
}

export function createDryRunCustomerEmailProvider(): CustomerEmailProvider {
  return {
    async sendEmail(input) {
      validateCustomerEmailProviderInput(input);
      return {
        providerName: CUSTOMER_EMAIL_PROVIDER_DRY_RUN_NAME,
        providerCalled: false,
        dryRunOnly: true,
        externalActionAllowed: false,
        status: "DRY_RUN_ACCEPTED"
      };
    }
  };
}

export function getCustomerEmailProvider(
  env: CustomerEmailProviderConfigEnv = {}
): CustomerEmailProvider {
  const config = parseCustomerEmailProviderConfig(env);
  if (config.provider === "resend" && config.realProviderCandidate) {
    return createDisabledResendCustomerEmailProvider();
  }

  return createDryRunCustomerEmailProvider();
}
