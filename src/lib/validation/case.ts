import { z } from "zod";

import {
  caseStageValues,
  clientRelationshipStatusValues,
  followUpActionStatusValues,
  followUpActionTypeValues
} from "@/types/case";

export const updateCaseStageSchema = z.object({
  stage: z.enum(caseStageValues),
  dueDate: z.string().trim().optional().or(z.literal("")),
  filingDeadline: z.string().trim().optional().or(z.literal("")),
  supplementDeadline: z.string().trim().optional().or(z.literal("")),
  stayExpirationDate: z.string().trim().optional().or(z.literal("")),
  internalDeadline: z.string().trim().optional().or(z.literal("")),
  internalMemo: z.string().trim().max(4000).optional(),
  closedAt: z.string().trim().optional().or(z.literal("")),
  closeReason: z.string().trim().max(300).optional(),
  outcomeSummary: z.string().trim().max(4000).optional(),
  nextFollowUpDate: z.string().trim().optional().or(z.literal("")),
  clientRelationshipStatus: z.enum(clientRelationshipStatusValues).optional(),
  reviewRequested: z.boolean().optional(),
  reviewCompleted: z.boolean().optional(),
  referralEligible: z.boolean().optional(),
  reengagementEligible: z.boolean().optional(),
  lastFollowUpAt: z.string().trim().optional().or(z.literal("")),
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

export const createFollowUpActionSchema = z.object({
  type: z.enum(followUpActionTypeValues),
  dueDate: z.string().trim().optional().or(z.literal("")),
  note: z.string().trim().max(2000).optional(),
  title: z.string().trim().max(200).optional()
});

export const updateFollowUpActionSchema = z
  .object({
    status: z.enum(followUpActionStatusValues).optional(),
    dueDate: z.string().trim().optional().or(z.literal("")),
    note: z.string().trim().max(2000).optional(),
    title: z.string().trim().max(200).optional()
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.dueDate !== undefined ||
      value.note !== undefined ||
      value.title !== undefined,
    {
      message: "At least one field must be provided."
    }
  );
