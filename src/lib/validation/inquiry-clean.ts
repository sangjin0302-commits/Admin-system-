import { z } from "zod";

import {
  clientTypeValues,
  inquiryTypeValues,
  urgencyValues,
  formLocaleValues,
  toLanguageCode
} from "@/types/inquiry";

const booleanish = z.union([z.boolean(), z.string()]);

function parseBooleanish(value: string | boolean) {
  if (typeof value === "boolean") return value;
  return value === "true" || value === "on";
}

export const createInquirySchema = z.object({
  preferredLocale: z.enum(formLocaleValues),
  clientType: z.enum(clientTypeValues),
  contactName: z
    .string()
    .trim()
    .min(2, "이름은 2자 이상 입력해 주세요.")
    .max(60, "이름은 60자 이하로 입력해 주세요."),
  organizationName: z
    .string()
    .trim()
    .max(100, "회사명은 100자 이하로 입력해 주세요.")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("올바른 이메일 주소를 입력해 주세요."),
  phone: z
    .string()
    .trim()
    .max(30, "전화번호는 30자 이하로 입력해 주세요.")
    .optional()
    .or(z.literal("")),
  title: z
    .string()
    .trim()
    .min(4, "문의 제목은 4자 이상 입력해 주세요.")
    .max(120, "문의 제목은 120자 이하로 입력해 주세요."),
  description: z
    .string()
    .trim()
    .min(20, "상세 내용은 20자 이상 입력해 주세요.")
    .max(2000, "상세 내용은 2000자 이하로 입력해 주세요."),
  requestedOutcome: z
    .string()
    .trim()
    .max(400, "원하는 결과는 400자 이하로 입력해 주세요.")
    .optional()
    .or(z.literal("")),
  requestedInquiryType: z.enum(inquiryTypeValues).optional().default("UNKNOWN"),
  declaredUrgency: z.enum(urgencyValues).optional().default("MEDIUM"),
  nationality: z
    .string()
    .trim()
    .max(80, "국적은 80자 이하로 입력해 주세요.")
    .optional()
    .or(z.literal("")),
  currentStatus: z
    .string()
    .trim()
    .max(120, "현재 상태는 120자 이하로 입력해 주세요.")
    .optional()
    .or(z.literal("")),
  documentCountry: z
    .string()
    .trim()
    .max(80, "문서 발행 국가는 80자 이하로 입력해 주세요.")
    .optional()
    .or(z.literal("")),
  targetAgency: z
    .string()
    .trim()
    .max(120, "제출처 또는 사용처는 120자 이하로 입력해 주세요.")
    .optional()
    .or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  hasPreparedDocuments: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  needsTranslation: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  isCorporateRequest: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  wantsCallback: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  consentToPrivacy: booleanish.transform((value) => parseBooleanish(value)).refine(Boolean, {
    message: "개인정보 수집 및 이용 동의가 필요합니다."
  })
});

export function parseCreateInquiryInput(payload: unknown) {
  const parsed = createInquirySchema.parse(payload);

  return {
    ...parsed,
    organizationName: parsed.organizationName?.trim() || undefined,
    phone: parsed.phone?.trim() || undefined,
    nationality: parsed.nationality?.trim() || undefined,
    currentStatus: parsed.currentStatus?.trim() || undefined,
    requestedOutcome: parsed.requestedOutcome?.trim() || undefined,
    requestedInquiryType: parsed.requestedInquiryType,
    declaredUrgency: parsed.declaredUrgency,
    documentCountry: parsed.documentCountry?.trim() || undefined,
    targetAgency: parsed.targetAgency?.trim() || undefined,
    dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
    preferredLanguage: toLanguageCode(parsed.preferredLocale)
  };
}
