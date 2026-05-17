import { z } from "zod";
import {
  accountingFeeStatusValues,
  accountingPaymentStatusValues,
  caseMatterStatusValues,
  caseTaskPriorityValues,
  caseTaskStatusValues,
  requiredDocumentStatusValues,
  supplementStatusValues
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

const optionalNullableString = (max: number) =>
  z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (value === "" || value === null) return null;
      return value;
    },
    z.string().trim().max(max).nullable().optional()
  );

const optionalNullableDateString = (field: string) =>
  z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (value === "" || value === null) return null;
      return value;
    },
    z
      .string()
      .trim()
      .nullable()
      .optional()
      .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
        message: `Invalid ${field} format.`
      })
  );

const optionalNonNegativeInteger = (field: string) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return null;
      if (typeof value === "string") return Number(value);
      return value;
    },
    z
      .number({
        invalid_type_error: `Invalid ${field} format.`
      })
      .int()
      .min(0)
      .nullable()
      .optional()
  );

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

export const createSupplementRequestSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().nullable(),
  receivedAt: optionalDateString("Invalid supplement request receivedAt format."),
  dueDate: optionalDateString("Invalid supplement request dueDate format."),
  requestedDocsJson: z.string().trim().max(2000).optional().nullable(),
  responseNote: z.string().trim().max(1000).optional().nullable(),
  actorName: z.string().trim().max(80).optional(),
  expectedCaseUpdatedAt: optionalExpectedDateString("expectedCaseUpdatedAt")
});

export const updateSupplementRequestMetadataSchema = z.object({
  mode: z.literal("metadata"),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().nullable(),
  receivedAt: optionalDateString("Invalid supplement request receivedAt format."),
  dueDate: optionalDateString("Invalid supplement request dueDate format."),
  requestedDocsJson: z.string().trim().max(2000).optional().nullable(),
  responseNote: z.string().trim().max(1000).optional().nullable(),
  actorName: z.string().trim().max(80).optional(),
  expectedUpdatedAt: optionalExpectedDateString("expectedUpdatedAt")
});

export const updateSupplementRequestStatusSchema = z.object({
  mode: z.literal("status"),
  status: z.enum(supplementStatusValues),
  statusChangeNote: z.string().trim().max(300).optional().nullable(),
  responseNote: z.string().trim().max(1000).optional().nullable(),
  respondedAt: optionalDateString("Invalid supplement request respondedAt format."),
  actorName: z.string().trim().max(80).optional(),
  expectedUpdatedAt: optionalExpectedDateString("expectedUpdatedAt")
});

export const updateSupplementRequestSchema = z.discriminatedUnion("mode", [
  updateSupplementRequestMetadataSchema,
  updateSupplementRequestStatusSchema
]);

export const updateCaseAccountingMemoSchema = z.object({
  feeAmount: optionalNonNegativeInteger("feeAmount"),
  feeStatus: z.enum(accountingFeeStatusValues).optional().default("UNSET"),
  paymentStatus: z.enum(accountingPaymentStatusValues).optional().default("UNSET"),
  paidAmount: optionalNonNegativeInteger("paidAmount"),
  paidAt: optionalDateString("Invalid accounting paidAt format."),
  paymentMemo: z.string().trim().max(1000).optional().nullable(),
  invoiceMemo: z.string().trim().max(1000).optional().nullable(),
  ledgerMemo: z.string().trim().max(1000).optional().nullable(),
  actorName: z.string().trim().max(80).optional(),
  expectedUpdatedAt: optionalExpectedDateString("expectedUpdatedAt"),
  expectedCaseUpdatedAt: optionalExpectedDateString("expectedCaseUpdatedAt")
});

export const updateImmigrationCaseDetailSchema = z
  .object({
    dispositionType: optionalNullableString(80),
    dispositionDate: optionalNullableDateString("dispositionDate"),
    noticeDate: optionalNullableDateString("noticeDate"),
    serviceDate: optionalNullableDateString("serviceDate"),
    appealDeadline: optionalNullableDateString("appealDeadline"),
    departureDeadline: optionalNullableDateString("departureDeadline"),
    detentionStartDate: optionalNullableDateString("detentionStartDate"),
    stayExpiryDate: optionalNullableDateString("stayExpiryDate"),
    submissionDeadline: optionalNullableDateString("submissionDeadline"),
    supplementDeadline: optionalNullableDateString("supplementDeadline"),
    resultExpectedDate: optionalNullableDateString("resultExpectedDate"),
    nationality: optionalNullableString(80),
    currentStayStatus: optionalNullableString(120),
    familyInKoreaSummary: optionalNullableString(500),
    residenceBaseSummary: optionalNullableString(500),
    employmentOrSchoolSummary: optionalNullableString(500),
    violationHistorySummary: optionalNullableString(500),
    scopeReviewRequired: z.boolean().optional(),
    attorneyScopeRisk: z.boolean().optional(),
    officialFormCheckRequired: z.boolean().optional(),
    deadlineVerifiedAt: optionalNullableDateString("deadlineVerifiedAt"),
    verifiedBy: optionalNullableString(80),
    syncCaseMatterDueDate: z.boolean().optional().default(false),
    actorName: z.string().trim().max(80).optional(),
    expectedUpdatedAt: optionalExpectedDateString("expectedUpdatedAt"),
    expectedCaseUpdatedAt: optionalExpectedDateString("expectedCaseUpdatedAt")
  })
  .strict();

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
export type CreateSupplementRequestPayload = z.infer<typeof createSupplementRequestSchema>;
export type UpdateSupplementRequestMetadataPayload = z.infer<
  typeof updateSupplementRequestMetadataSchema
>;
export type UpdateSupplementRequestStatusPayload = z.infer<
  typeof updateSupplementRequestStatusSchema
>;
export type UpdateSupplementRequestPayload = z.infer<typeof updateSupplementRequestSchema>;
export type UpdateCaseAccountingMemoPayload = z.infer<typeof updateCaseAccountingMemoSchema>;
export type UpdateImmigrationCaseDetailPayload = z.infer<
  typeof updateImmigrationCaseDetailSchema
>;
