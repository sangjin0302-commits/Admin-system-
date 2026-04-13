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
  contactName: z.string().trim().min(2).max(60),
  organizationName: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(20).max(2000),
  requestedOutcome: z.string().trim().max(400).optional().or(z.literal("")),
  requestedInquiryType: z.enum(inquiryTypeValues).optional().default("UNKNOWN"),
  declaredUrgency: z.enum(urgencyValues).optional().default("MEDIUM"),
  nationality: z.string().trim().max(80).optional().or(z.literal("")),
  currentStatus: z.string().trim().max(120).optional().or(z.literal("")),
  documentCountry: z.string().trim().max(80).optional().or(z.literal("")),
  targetAgency: z.string().trim().max(120).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  hasPreparedDocuments: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  needsTranslation: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  isCorporateRequest: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  wantsCallback: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  consentToPrivacy: booleanish.transform((value) => parseBooleanish(value)).refine(Boolean, {
    message: "개인정보 수집 동의가 필요합니다."
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
