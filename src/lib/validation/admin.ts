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
  sort: z.enum(adminSortValues).optional().default("latest")
});

export function parseAdminInquiryQuery(params: Record<string, string | string[] | undefined>) {
  return adminInquiryQuerySchema.parse({
    q: typeof params.q === "string" ? params.q : undefined,
    inquiryType: typeof params.inquiryType === "string" ? params.inquiryType : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    urgency: typeof params.urgency === "string" ? params.urgency : undefined,
    language: typeof params.language === "string" ? params.language : undefined,
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
