import type {
  BridgeWorkflowStatus,
  InquiryStatus
} from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import { buildIntakeCategoryDetailSummary } from "@/lib/services/intake-category-detail-summary";

const TRACKING_CODE_PATTERN =
  /^[0-9]{8}-(VI|CO|AP|FC|PL|AR|CP)-[0-9]{4}-[A-HJ-NP-Z2-9]{2,6}$/;
const FORBIDDEN_PUBLIC_TEXT_PATTERN = /[\u0000\u00ec\u00eb\u00ed\u00c2\u0085\uFFFD]/;

const CATEGORY_LABELS_BY_CODE: Record<string, string> = {
  VI: "\uBE44\uC790",
  CO: "\uBC95\uC778",
  AP: "\uD589\uC815\uC2EC\uD310",
  FC: "\uC0AC\uC2E4\uC870\uC0AC \uBC0F \uACC4\uC57D\uC11C \uC791\uC131",
  PL: "\uC778\uD5C8\uAC00",
  AR: "\uC544\uB78D\uC5B4 \uD1B5\uBC88\uC5ED",
  CP: "\uAE30\uD0C0 \uBBFC\uC6D0"
};

export type PublicTrackingLookupInput = {
  trackingCode?: unknown;
  phoneLast4?: unknown;
};

export type PublicTrackingCustomerStatus =
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "IN_REVIEW"
  | "DOCUMENTS_REQUESTED"
  | "COMPLETED";

export type PublicTrackingLookupDto = {
  trackingCode: string;
  categoryLabel: string | null;
  categoryDetailLabel: string | null;
  receivedAt: string;
  lastUpdatedAt: string;
  customerStatus: PublicTrackingCustomerStatus;
  customerStatusLabel: string;
  message: string;
  documentsRequested: boolean;
  nextStepLabel: string;
};

type PublicTrackingInquiryRow = {
  publicTrackingCode: string | null;
  publicTrackingPhoneLast4: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: InquiryStatus;
  bridgeWorkflowStatus: BridgeWorkflowStatus;
  description: string;
  _count?: {
    documentRequestTasks?: number;
  };
};

type PublicTrackingLookupPrismaClient = {
  inquiry: {
    findFirst(args: unknown): Promise<PublicTrackingInquiryRow | null>;
  };
};

export type PublicTrackingLookupDependencies = {
  prismaClient?: PublicTrackingLookupPrismaClient;
};

export type PublicTrackingValidationResult =
  | {
      ok: true;
      trackingCode: string;
      phoneLast4: string;
    }
  | {
      ok: false;
      status: 400;
      error: string;
    };

export const PUBLIC_TRACKING_NOT_FOUND_MESSAGE =
  "\uC811\uC218 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC811\uC218\uBC88\uD638\uC640 \uD734\uB300\uD3F0 \uB4A4 4\uC790\uB9AC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.";

const KO_REQUIRED_TRACKING_CODE =
  "\uC811\uC218\uBC88\uD638\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.";
const KO_INVALID_TRACKING_CODE =
  "\uC811\uC218\uBC88\uD638 \uD615\uC2DD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.";
const KO_REQUIRED_PHONE_LAST4 =
  "\uD734\uB300\uD3F0 \uB4A4 4\uC790\uB9AC\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.";

function toStringInput(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

export function normalizePublicTrackingLookupCode(value: unknown) {
  return toStringInput(value).trim().toUpperCase();
}

export function isValidPublicTrackingLookupCode(value: string) {
  return TRACKING_CODE_PATTERN.test(value);
}

export function normalizePublicTrackingLookupPhoneLast4(value: unknown) {
  const digits = toStringInput(value).replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

export function validatePublicTrackingLookupInput(
  input: PublicTrackingLookupInput
): PublicTrackingValidationResult {
  const trackingCode = normalizePublicTrackingLookupCode(input.trackingCode);
  if (!trackingCode) {
    return { ok: false, status: 400, error: KO_REQUIRED_TRACKING_CODE };
  }
  if (!isValidPublicTrackingLookupCode(trackingCode)) {
    return { ok: false, status: 400, error: KO_INVALID_TRACKING_CODE };
  }

  const phoneLast4 = normalizePublicTrackingLookupPhoneLast4(input.phoneLast4);
  if (!phoneLast4) {
    return { ok: false, status: 400, error: KO_REQUIRED_PHONE_LAST4 };
  }

  return { ok: true, trackingCode, phoneLast4 };
}

function safePublicText(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || FORBIDDEN_PUBLIC_TEXT_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function getCategoryLabelFromTrackingCode(trackingCode: string) {
  const categoryCode = trackingCode.split("-")[1] ?? "";
  return CATEGORY_LABELS_BY_CODE[categoryCode] ?? null;
}

function getCustomerStatus(input: {
  inquiryStatus: InquiryStatus;
  bridgeWorkflowStatus: BridgeWorkflowStatus;
  documentsRequested: boolean;
}): PublicTrackingCustomerStatus {
  if (
    input.inquiryStatus === "CLOSED" ||
    input.inquiryStatus === "WON" ||
    input.bridgeWorkflowStatus === "CLOSED"
  ) {
    return "COMPLETED";
  }

  if (
    input.documentsRequested ||
    input.bridgeWorkflowStatus === "AWAITING_MORE_FACTS"
  ) {
    return "DOCUMENTS_REQUESTED";
  }

  if (
    input.bridgeWorkflowStatus === "APPROVAL_PENDING" ||
    input.bridgeWorkflowStatus === "APPROVED"
  ) {
    return "IN_REVIEW";
  }

  if (input.inquiryStatus === "NEW") {
    return "RECEIVED";
  }

  return "UNDER_REVIEW";
}

function getCustomerStatusCopy(status: PublicTrackingCustomerStatus) {
  const copy: Record<
    PublicTrackingCustomerStatus,
    { label: string; message: string; nextStepLabel: string }
  > = {
    RECEIVED: {
      label: "\uC811\uC218 \uC644\uB8CC",
      message:
        "\uC811\uC218 \uC815\uBCF4\uB97C \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4. \uB2F4\uB2F9\uC790\uAC00 \uD655\uC778 \uD6C4 \uC5F0\uB77D\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.",
      nextStepLabel:
        "\uB2F4\uB2F9\uC790\uAC00 \uC811\uC218 \uB0B4\uC6A9\uC744 \uD655\uC778\uD560 \uC608\uC815\uC785\uB2C8\uB2E4."
    },
    UNDER_REVIEW: {
      label: "\uB2F4\uB2F9\uC790 \uD655\uC778 \uC911",
      message:
        "\uB2F4\uB2F9\uC790\uAC00 \uC811\uC218 \uB0B4\uC6A9\uC744 \uD655\uC778\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
      nextStepLabel:
        "\uD655\uC778 \uD6C4 \uC0C1\uB2F4 \uB610\uB294 \uCD94\uAC00 \uC548\uB0B4\uB97C \uB4DC\uB9B4 \uC608\uC815\uC785\uB2C8\uB2E4."
    },
    IN_REVIEW: {
      label: "\uAC80\uD1A0 \uC9C4\uD589 \uC911",
      message:
        "\uB2F4\uB2F9\uC790\uAC00 \uC0AC\uAC74 \uB0B4\uC6A9\uC744 \uAC80\uD1A0\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
      nextStepLabel:
        "\uAC80\uD1A0 \uACB0\uACFC\uC5D0 \uB530\uB77C \uB2E4\uC74C \uC808\uCC28\uB97C \uC548\uB0B4\uD558\uACA0\uC2B5\uB2C8\uB2E4."
    },
    DOCUMENTS_REQUESTED: {
      label: "\uCD94\uAC00\uC790\uB8CC \uC694\uCCAD",
      message:
        "\uCD94\uAC00\uC790\uB8CC \uD655\uC778\uC774 \uD544\uC694\uD55C \uC0C1\uD0DC\uC785\uB2C8\uB2E4.",
      nextStepLabel:
        "\uB2F4\uB2F9\uC790\uAC00 \uC694\uCCAD\uD55C \uC790\uB8CC\uB97C \uC900\uBE44\uD574 \uC8FC\uC138\uC694."
    },
    COMPLETED: {
      label: "\uCC98\uB9AC \uC644\uB8CC",
      message: "\uC811\uC218\uAC74 \uCC98\uB9AC\uAC00 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
      nextStepLabel:
        "\uCD94\uAC00 \uBB38\uC758\uAC00 \uC788\uC73C\uBA74 \uC0AC\uBB34\uC18C\uB85C \uC5F0\uB77D\uD574 \uC8FC\uC138\uC694."
    }
  };

  return copy[status];
}

export function buildPublicTrackingLookupDto(
  inquiry: PublicTrackingInquiryRow
): PublicTrackingLookupDto | null {
  const trackingCode = safePublicText(inquiry.publicTrackingCode);
  if (!trackingCode) return null;

  const summary = buildIntakeCategoryDetailSummary(inquiry.description);
  const documentsRequested =
    Boolean(inquiry._count?.documentRequestTasks) ||
    inquiry.bridgeWorkflowStatus === "AWAITING_MORE_FACTS";
  const customerStatus = getCustomerStatus({
    inquiryStatus: inquiry.status,
    bridgeWorkflowStatus: inquiry.bridgeWorkflowStatus,
    documentsRequested
  });
  const statusCopy = getCustomerStatusCopy(customerStatus);

  return {
    trackingCode,
    categoryLabel:
      safePublicText(summary.categoryLabel) ?? getCategoryLabelFromTrackingCode(trackingCode),
    categoryDetailLabel: safePublicText(summary.subtypeLabel),
    receivedAt: inquiry.createdAt.toISOString(),
    lastUpdatedAt: inquiry.updatedAt.toISOString(),
    customerStatus,
    customerStatusLabel: statusCopy.label,
    message: statusCopy.message,
    documentsRequested,
    nextStepLabel: statusCopy.nextStepLabel
  };
}

export async function lookupPublicTrackingStatus(
  input: { trackingCode: string; phoneLast4: string },
  dependencies: PublicTrackingLookupDependencies = {}
) {
  const prismaClient =
    dependencies.prismaClient ?? (prisma as unknown as PublicTrackingLookupPrismaClient);

  const inquiry = await prismaClient.inquiry.findFirst({
    where: {
      publicTrackingCode: input.trackingCode,
      publicTrackingPhoneLast4: input.phoneLast4
    },
    select: {
      publicTrackingCode: true,
      publicTrackingPhoneLast4: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      bridgeWorkflowStatus: true,
      description: true,
      _count: {
        select: {
          documentRequestTasks: true
        }
      }
    }
  });

  if (!inquiry) return null;
  return buildPublicTrackingLookupDto(inquiry);
}
