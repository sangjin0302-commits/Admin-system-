import { z } from "zod";

import { caseStageValues } from "@/types/case";

export const updateCaseStageSchema = z.object({
  stage: z.enum(caseStageValues),
  dueDate: z.string().trim().optional().or(z.literal("")),
  filingDeadline: z.string().trim().optional().or(z.literal("")),
  supplementDeadline: z.string().trim().optional().or(z.literal("")),
  stayExpirationDate: z.string().trim().optional().or(z.literal("")),
  internalDeadline: z.string().trim().optional().or(z.literal("")),
  internalMemo: z.string().trim().max(4000).optional(),
  logNote: z.string().trim().max(4000).optional()
});

export const updateCaseDocumentSchema = z
  .object({
    isReceived: z.boolean().optional(),
    note: z.string().trim().max(1000).optional()
  })
  .refine((value) => value.isReceived !== undefined || value.note !== undefined, {
    message: "At least one field must be provided."
  });
