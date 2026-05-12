import { z } from "zod";
import {
  caseMatterStatusValues,
  caseTaskPriorityValues,
  caseTaskStatusValues,
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

const optionalDateString = (message: string) =>
  z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message
    });

const optionalExpectedDateString = (field: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
      message: `Invalid ${field} format.`
    });

export const createCaseTaskSchema = z.object({
  title: z.string().trim().min(2).max(160),
  details: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  status: z.enum(caseTaskStatusValues).optional().default("TODO"),
  priority: z.enum(caseTaskPriorityValues).optional().default("NORMAL"),
  dueDate: optionalDateString("Invalid case task dueDate format."),
  assignedTo: z.string().trim().max(80).optional().nullable(),
  actorName: z.string().trim().max(80).optional(),
  expectedCaseUpdatedAt: optionalExpectedDateString("expectedCaseUpdatedAt")
});

export const updateCaseTaskMetadataSchema = z.object({
  mode: z.literal("metadata"),
  title: z.string().trim().min(2).max(160),
  details: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  priority: z.enum(caseTaskPriorityValues),
  dueDate: optionalDateString("Invalid case task dueDate format."),
  assignedTo: z.string().trim().max(80).optional().nullable(),
  actorName: z.string().trim().max(80).optional(),
  expectedUpdatedAt: optionalExpectedDateString("expectedUpdatedAt")
});

export const updateCaseTaskStatusSchema = z.object({
  mode: z.literal("status"),
  status: z.enum(caseTaskStatusValues),
  statusChangeNote: z.string().trim().max(300).optional().nullable(),
  actorName: z.string().trim().max(80).optional(),
  expectedUpdatedAt: optionalExpectedDateString("expectedUpdatedAt")
});

export const updateCaseTaskSchema = z.discriminatedUnion("mode", [
  updateCaseTaskMetadataSchema,
  updateCaseTaskStatusSchema
]);

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
export type CreateCaseTaskPayload = z.infer<typeof createCaseTaskSchema>;
export type UpdateCaseTaskMetadataPayload = z.infer<typeof updateCaseTaskMetadataSchema>;
export type UpdateCaseTaskStatusPayload = z.infer<typeof updateCaseTaskStatusSchema>;
export type UpdateCaseTaskPayload = z.infer<typeof updateCaseTaskSchema>;
