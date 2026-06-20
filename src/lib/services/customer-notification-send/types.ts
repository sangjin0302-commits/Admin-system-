import {
  CUSTOMER_NOTIFICATION_MESSAGE_VERSION,
  CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS,
  type CustomerNotificationChannel
} from "@/lib/services/customer-notification-preview-service";
import type { CustomerEmailProvider } from "@/lib/services/customer-email-provider";

type CustomerNotificationSendConfirmationKey =
  (typeof CUSTOMER_NOTIFICATION_REQUIRED_CONFIRMATIONS)[number];

export type CustomerNotificationSendConfirmations = Record<
  CustomerNotificationSendConfirmationKey,
  boolean
>;

export type CustomerNotificationSendInput = {
  inquiryId: string;
  channel: CustomerNotificationChannel | string;
  previewHash: string;
  messageVersion: string;
  idempotencyKey: string;
  confirmations: Partial<CustomerNotificationSendConfirmations>;
  resendReason?: string | null;
};

export type ManualCustomerNotificationSendResult = {
  status: "SENT";
  channel: "manual";
  deliveryMode: "manual_audit_only";
  recipientPreview: string;
  messageVersion: typeof CUSTOMER_NOTIFICATION_MESSAGE_VERSION;
  previewHash: string;
  idempotencyKey: string;
  sentAt: string;
  externalActionAllowed: false;
  providerCalled: false;
  isResend: boolean;
};

export type EmailCustomerNotificationDryRunResult = {
  status: "DRY_RUN_RECORDED";
  channel: "email";
  deliveryMode: "email_dry_run_only";
  recipientPreview: string;
  providerName: "dry-run";
  providerCalled: false;
  dryRunOnly: true;
  externalActionAllowed: false;
  messageVersion: typeof CUSTOMER_NOTIFICATION_MESSAGE_VERSION;
  previewHash: string;
  idempotencyKey: string;
  recordedAt: string;
  isResend: boolean;
};

export type CustomerNotificationSendResult =
  | ManualCustomerNotificationSendResult
  | EmailCustomerNotificationDryRunResult;

export type InquiryRow = {
  id: string;
  email: string | null;
  phone: string | null;
  publicTrackingCode: string | null;
  consentToPrivacy: boolean;
  communicationLogs: string | null;
};

export type TransactionClient = {
  inquiry: {
    findUnique(args: unknown): Promise<InquiryRow | null>;
    update(args: unknown): Promise<unknown>;
  };
};

export type CustomerNotificationSendPrismaClient = {
  $transaction<T>(callback: (tx: TransactionClient) => Promise<T>): Promise<T>;
};

export type CustomerNotificationSendDependencies = {
  prismaClient?: CustomerNotificationSendPrismaClient;
  emailProvider?: CustomerEmailProvider;
  now?: () => Date;
};

export const MANUAL_RECIPIENT_PREVIEW = "수동 전달";
