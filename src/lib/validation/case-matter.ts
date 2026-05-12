import { z } from "zod";
import {
  caseMatterStatusValues,
  requiredDocumentStatusValues
} from "@/types/case-matter";

export const convertInquiryToCaseMatterSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  matterType: z.string().trim().min(2).max(80).optional(),
  assignedTo: z.string().trim().max(80).optional(),
  actorName: z.string().trim().max(80).optional(),
  forceCreate: z.boolean().optional().default(false),
  updateInquiryStatusToWon: z.boolean().optional().default(false)
});

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

export const updateRequiredDocumentStatusSchema = z.object({
  status: z.enum(requiredDocumentStatusValues),
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

export const createRequiredDocumentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional(),
  required: z.boolean().optional().default(true),
  dueDate: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Invalid required document dueDate format."
    }),
  actorName: z.string().trim().max(80).optional(),
  expectedCaseUpdatedAt: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Invalid expectedCaseUpdatedAt format."
    })
});

export const updateRequiredDocumentMetadataSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional().nullable(),
  required: z.boolean(),
  dueDate: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Invalid required document dueDate format."
    }),
  actorName: z.string().trim().max(80).optional(),
  expectedUpdatedAt: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Invalid expectedUpdatedAt format."
    }),
  expectedCaseUpdatedAt: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Invalid expectedCaseUpdatedAt format."
    })
});

export const startRequiredDocumentChecklistSchema = z.object({
  actorName: z.string().trim().max(80).optional(),
  expectedCaseUpdatedAt: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: "Invalid expectedCaseUpdatedAt format."
    })
});

export type ConvertInquiryToCaseMatterPayload = z.infer<typeof convertInquiryToCaseMatterSchema>;
export type UpdateCaseMatterStatusPayload = z.infer<typeof updateCaseMatterStatusSchema>;
export type UpdateRequiredDocumentStatusPayload = z.infer<typeof updateRequiredDocumentStatusSchema>;
export type CreateRequiredDocumentPayload = z.infer<typeof createRequiredDocumentSchema>;
export type UpdateRequiredDocumentMetadataPayload = z.infer<
  typeof updateRequiredDocumentMetadataSchema
>;
export type StartRequiredDocumentChecklistPayload = z.infer<
  typeof startRequiredDocumentChecklistSchema
>;
