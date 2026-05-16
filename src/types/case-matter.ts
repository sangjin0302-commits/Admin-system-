import {
  caseMatterStatusLabelMessages,
  requiredDocumentStatusLabelMessages
} from "@/i18n/locales/case-matter";
import type { UiLocale } from "@/i18n/shared";

export const caseMatterStatusValues = [
  "INTAKE_REVIEW",
  "CONSULTING",
  "QUOTED",
  "CONTRACT_PENDING",
  "OPEN",
  "DOCUMENT_COLLECTING",
  "DOCUMENT_REVIEWING",
  "READY_TO_SUBMIT",
  "SUBMITTED",
  "SUPPLEMENT_REQUESTED",
  "WAITING_AGENCY",
  "RESULT_RECEIVED",
  "CLOSING",
  "CLOSED",
  "CANCELLED",
  "ON_HOLD"
] as const;

export type CaseMatterStatusValue = (typeof caseMatterStatusValues)[number];

export const requiredDocumentStatusValues = [
  "NEEDED",
  "REQUESTED",
  "RECEIVED",
  "IN_REVIEW",
  "APPROVED",
  "NEEDS_FIX",
  "REJECTED",
  "NOT_APPLICABLE"
] as const;

export type RequiredDocumentStatusValue = (typeof requiredDocumentStatusValues)[number];

export const caseTaskStatusValues = [
  "OPEN",
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
  "CANCELLED"
] as const;

export type CaseTaskStatusValue = (typeof caseTaskStatusValues)[number];

export const caseTaskPriorityValues = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export type CaseTaskPriorityValue = (typeof caseTaskPriorityValues)[number];

export const supplementStatusValues = [
  "RECEIVED",
  "ANALYZING",
  "DOCS_REQUESTED",
  "CLIENT_WAITING",
  "RESPONSE_DRAFTING",
  "READY_TO_RESPOND",
  "RESPONDED",
  "CLOSED",
  "OVERDUE",
  "CANCELLED"
] as const;

export type SupplementStatusValue = (typeof supplementStatusValues)[number];

export const accountingFeeStatusValues = ["UNSET", "ESTIMATED", "CONFIRMED", "WAIVED"] as const;

export type AccountingFeeStatusValue = (typeof accountingFeeStatusValues)[number];

export const accountingPaymentStatusValues = [
  "UNSET",
  "UNPAID",
  "PARTIAL",
  "PAID",
  "REFUNDED"
] as const;

export type AccountingPaymentStatusValue = (typeof accountingPaymentStatusValues)[number];

function isCaseMatterStatus(value: unknown): value is CaseMatterStatusValue {
  return typeof value === "string" && caseMatterStatusValues.includes(value as CaseMatterStatusValue);
}

function isRequiredDocumentStatus(value: unknown): value is RequiredDocumentStatusValue {
  return (
    typeof value === "string" && requiredDocumentStatusValues.includes(value as RequiredDocumentStatusValue)
  );
}

function normalizeCaseMatterLocale(locale: UiLocale): UiLocale {
  return locale === "en" ? "en" : "ko";
}

export function normalizeCaseMatterStatus(value: unknown): CaseMatterStatusValue {
  return isCaseMatterStatus(value) ? value : "INTAKE_REVIEW";
}

export function normalizeRequiredDocumentStatus(value: unknown): RequiredDocumentStatusValue {
  return isRequiredDocumentStatus(value) ? value : "NEEDED";
}

export function getCaseMatterStatusLabel(value: unknown, locale: UiLocale = "ko") {
  const normalizedLocale = normalizeCaseMatterLocale(locale);
  const status = normalizeCaseMatterStatus(value);
  return caseMatterStatusLabelMessages[normalizedLocale][status];
}

export function getRequiredDocumentStatusLabel(value: unknown, locale: UiLocale = "ko") {
  const normalizedLocale = normalizeCaseMatterLocale(locale);
  const status = normalizeRequiredDocumentStatus(value);
  return requiredDocumentStatusLabelMessages[normalizedLocale][status];
}
