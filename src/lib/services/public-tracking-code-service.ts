import { randomInt } from "node:crypto";

import { parseInquiryCommunicationLogs } from "@/lib/services/inquiry-guard-helpers";
import type { InquiryCommunicationLogEntry } from "@/lib/services/inquiry-guard-types";
import type { IntakeCategory } from "@/types/intake-category";

const KOREA_TIME_ZONE = "Asia/Seoul";
const PUBLIC_TRACKING_LOG_SUMMARY = "고객용 접수번호 발급";
const PUBLIC_TRACKING_DETAILS_PREFIX = "접수번호:";
const CHECK_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const CATEGORY_CODES: Record<IntakeCategory, string> = {
  visa: "VI",
  corporation: "CO",
  administrative_appeal: "AP",
  fact_finding_contract: "FC",
  permit_license: "PL",
  arabic_translation: "AR",
  civil_petition: "CP"
};

export type PublicTrackingCodeInput = {
  category: IntakeCategory;
  createdAt: Date;
  monthlySequence: number;
  checkCode?: string;
};

export function getPublicTrackingCategoryCode(category: IntakeCategory) {
  return CATEGORY_CODES[category];
}

function getKoreaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number.parseInt(getPart("year"), 10),
    month: Number.parseInt(getPart("month"), 10),
    day: Number.parseInt(getPart("day"), 10)
  };
}

function formatKoreaDate(date: Date) {
  const { year, month, day } = getKoreaDateParts(date);
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
}

export function getKoreaMonthRange(date: Date) {
  const { year, month } = getKoreaDateParts(date);
  return {
    start: new Date(Date.UTC(year, month - 1, 1, -9, 0, 0, 0)),
    end: new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1, -9, 0, 0, 0))
  };
}

export function generatePublicTrackingCheckCode(length = 2) {
  const safeLength = Math.max(2, Math.floor(length));
  let output = "";
  for (let index = 0; index < safeLength; index += 1) {
    output += CHECK_CODE_ALPHABET[randomInt(0, CHECK_CODE_ALPHABET.length)];
  }
  return output;
}

export function normalizePublicTrackingCheckCode(value: string) {
  return value
    .toUpperCase()
    .replace(/[O0I1]/g, "")
    .replace(/[^A-Z2-9]/g, "")
    .slice(0, 6);
}

export function generatePublicTrackingCode(input: PublicTrackingCodeInput) {
  if (!Number.isInteger(input.monthlySequence) || input.monthlySequence < 1) {
    throw new Error("monthlySequence must be a positive integer.");
  }

  const checkCode = normalizePublicTrackingCheckCode(input.checkCode ?? generatePublicTrackingCheckCode());
  if (checkCode.length < 2) {
    throw new Error("checkCode must contain at least two non-ambiguous characters.");
  }

  return [
    formatKoreaDate(input.createdAt),
    getPublicTrackingCategoryCode(input.category),
    String(input.monthlySequence).padStart(4, "0"),
    checkCode
  ].join("-");
}

export function buildPublicTrackingCommunicationLogEntry(
  trackingCode: string,
  createdAt: Date
): InquiryCommunicationLogEntry {
  return {
    id: `public-tracking-${trackingCode}`,
    createdAt: createdAt.toISOString(),
    channel: "INTERNAL",
    summary: PUBLIC_TRACKING_LOG_SUMMARY,
    details: `${PUBLIC_TRACKING_DETAILS_PREFIX} ${trackingCode}`,
    responsePending: false,
    nextContactAt: null
  };
}

export function extractPublicTrackingCodeFromCommunicationLogs(value: string | null | undefined) {
  const logs = parseInquiryCommunicationLogs(value);
  const trackingLog = logs.find((entry) => entry.summary === PUBLIC_TRACKING_LOG_SUMMARY);
  if (!trackingLog) return null;

  const match = trackingLog.details.match(/접수번호:\s*([0-9]{8}-[A-Z]{2}-[0-9]{4}-[A-Z2-9]{2,6})/);
  return match?.[1] ?? null;
}

