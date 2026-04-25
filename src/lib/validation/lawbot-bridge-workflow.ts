import { z } from "zod";

import {
  bridgeWorkflowStatusValues,
  workflowDraftStatusValues,
  workflowTaskStatusValues
} from "../../types/lawbot-bridge-workflow";

const stringArraySchema = z.array(z.string().trim().min(1)).default([]);
const recordIdSchema = z.string().trim().min(1);
const optionalJsonObjectSchema = z.record(z.unknown()).optional();

const workflowGateSchema = z.object({
  reviewRequired: z.boolean().default(false),
  mustVerify: stringArraySchema,
  mustVerifySources: stringArraySchema,
  riskFlags: stringArraySchema,
  practitionerGuide: optionalJsonObjectSchema,
  caseOutlook: optionalJsonObjectSchema
});

export const inquiryWorkflowRecordSchema = z.object({
  inquiryId: recordIdSchema,
  status: z.enum(bridgeWorkflowStatusValues),
  ...workflowGateSchema.shape,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const caseWorkflowRecordSchema = z.object({
  inquiryId: recordIdSchema,
  caseId: recordIdSchema.optional(),
  status: z.enum(bridgeWorkflowStatusValues),
  ...workflowGateSchema.shape,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const caseTaskCreateSchema = z.object({
  inquiryId: recordIdSchema,
  caseId: recordIdSchema.optional(),
  title: z.string().trim().min(1),
  details: z.string().trim().optional(),
  taskType: z.string().trim().min(1).default("GENERAL"),
  status: z.enum(workflowTaskStatusValues).default("OPEN"),
  reviewRequired: z.boolean().default(false),
  mustVerify: stringArraySchema,
  riskFlags: stringArraySchema
});

export const sourceVerificationTaskCreateSchema = z.object({
  inquiryId: recordIdSchema,
  caseId: recordIdSchema.optional(),
  documentDraftId: recordIdSchema.optional(),
  messageDraftId: recordIdSchema.optional(),
  title: z.string().trim().min(1),
  authorityBucket: z.string().trim().optional(),
  sourceLabel: z.string().trim().min(1),
  sourceCitation: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(workflowTaskStatusValues).default("OPEN"),
  reviewRequired: z.boolean().default(true),
  mustVerify: stringArraySchema,
  riskFlags: stringArraySchema
});

export const documentRequestTaskCreateSchema = z.object({
  inquiryId: recordIdSchema,
  caseId: recordIdSchema.optional(),
  title: z.string().trim().min(1),
  documentLabel: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  status: z.enum(workflowTaskStatusValues).default("OPEN"),
  reviewRequired: z.boolean().default(false),
  mustVerify: stringArraySchema,
  riskFlags: stringArraySchema
});

export const documentDraftCreateSchema = z.object({
  inquiryId: recordIdSchema,
  caseId: recordIdSchema.optional(),
  draftType: z.string().trim().min(1),
  title: z.string().trim().optional(),
  bodyJson: z.string().trim().default("{}"),
  status: z.enum(workflowDraftStatusValues).default("DRAFT_CREATED"),
  ...workflowGateSchema.shape
});

export const messageDraftCreateSchema = z.object({
  inquiryId: recordIdSchema,
  caseId: recordIdSchema.optional(),
  messageKind: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  bodyText: z.string().trim().min(1),
  status: z.enum(workflowDraftStatusValues).default("DRAFT_CREATED"),
  ...workflowGateSchema.shape
});

type ApprovalGateSnapshot = {
  status: (typeof workflowDraftStatusValues)[number];
  reviewRequired: boolean;
  mustVerify: string[];
  mustVerifySources: string[];
};

export function shouldMoveDraftToApprovalPending(input: ApprovalGateSnapshot) {
  return input.reviewRequired && input.status === "DRAFT_CREATED";
}

export function canExternalOutputProceed(input: ApprovalGateSnapshot) {
  if (input.status !== "APPROVED") {
    return false;
  }
  if (input.reviewRequired) {
    return false;
  }
  if (input.mustVerify.length > 0) {
    return false;
  }
  if (input.mustVerifySources.length > 0) {
    return false;
  }
  return true;
}
