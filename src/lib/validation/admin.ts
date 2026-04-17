import { z } from "zod";

import {
  adminSortValues,
  inquiryStatusValues,
  inquiryTypeValues,
  languageCodeValues,
  urgencyValues
} from "@/types/inquiry";

export const adminInquiryQuerySchema = z.object({
  q: z.string().trim().optional().catch(""),
  inquiryType: z.enum(inquiryTypeValues).optional(),
  status: z.enum(inquiryStatusValues).optional(),
  urgency: z.enum(urgencyValues).optional(),
  language: z.enum(languageCodeValues).optional(),
  assignee: z.string().trim().optional().catch(""),
  retained: z.enum(["all", "won", "active"]).optional().default("all"),
  sort: z.enum(adminSortValues).optional().default("latest")
});

export function parseAdminInquiryQuery(params: Record<string, string | string[] | undefined>) {
  return adminInquiryQuerySchema.parse({
    q: typeof params.q === "string" ? params.q : undefined,
    inquiryType: typeof params.inquiryType === "string" ? params.inquiryType : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    urgency: typeof params.urgency === "string" ? params.urgency : undefined,
    language: typeof params.language === "string" ? params.language : undefined,
    assignee: typeof params.assignee === "string" ? params.assignee : undefined,
    retained: typeof params.retained === "string" ? params.retained : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined
  });
}

export const updateInquiryAdminSchema = z
  .object({
    status: z.enum(inquiryStatusValues).optional(),
    assignee: z.string().trim().max(80).optional(),
    internalMemo: z.string().trim().max(4000).optional()
  })
  .refine(
    (value) =>
      value.status !== undefined || value.assignee !== undefined || value.internalMemo !== undefined,
    {
      message: "At least one field must be provided."
    }
  );

export const communicationChannelValues = [
  "EMAIL",
  "PHONE",
  "KAKAO",
  "SMS",
  "VISIT",
  "INTERNAL"
] as const;

export const appendInquiryCommunicationLogSchema = z.object({
  channel: z.enum(communicationChannelValues),
  summary: z.string().trim().min(2, "연락 요약을 입력해 주세요.").max(400, "연락 요약은 400자 이내로 입력해 주세요."),
  details: z.string().trim().max(3000, "상세 메모는 3000자 이내로 입력해 주세요.").optional().default(""),
  responsePending: z.boolean().default(false),
  nextContactAt: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || !Number.isNaN(new Date(value).getTime()), {
      message: "다음 연락 예정일 형식이 올바르지 않습니다."
    })
});
