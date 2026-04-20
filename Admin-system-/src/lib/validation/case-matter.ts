import { z } from "zod";

export const convertInquiryToCaseMatterSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  matterType: z.string().trim().min(2).max(80).optional(),
  assignedTo: z.string().trim().max(80).optional(),
  actorName: z.string().trim().max(80).optional(),
  forceCreate: z.boolean().optional().default(false),
  updateInquiryStatusToWon: z.boolean().optional().default(false)
});

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

export const updateCaseMatterStatusSchema = z.object({
  status: z.enum(caseMatterStatusValues),
  statusChangeNote: z.string().trim().max(300).optional(),
  actorName: z.string().trim().max(80).optional(),
  expectedUpdatedAt: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Invalid expectedUpdatedAt format."
    })
});

export type ConvertInquiryToCaseMatterPayload = z.infer<typeof convertInquiryToCaseMatterSchema>;
export type UpdateCaseMatterStatusPayload = z.infer<typeof updateCaseMatterStatusSchema>;
