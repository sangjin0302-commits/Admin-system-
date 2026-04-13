import { z } from "zod";

import { submissionPackageStatusValues, supplementRequestStatusValues } from "@/types/submission";

export const createSubmissionPackageSchema = z.object({
  packageLabel: z.string().trim().max(120).optional(),
  submittedTo: z.string().trim().max(120).optional(),
  note: z.string().trim().max(2000).optional(),
  status: z.enum(submissionPackageStatusValues).optional(),
  selectedDocumentItemIds: z.array(z.string().trim().min(1)).optional()
});

export const updateSubmissionPackageSchema = z.object({
  status: z.enum(submissionPackageStatusValues).optional(),
  packageLabel: z.string().trim().max(120).optional(),
  submittedTo: z.string().trim().max(120).optional(),
  submittedAt: z.string().trim().optional().or(z.literal("")),
  note: z.string().trim().max(2000).optional()
});

export const createSupplementRequestSchema = z.object({
  submissionPackageId: z.string().trim().min(1).optional(),
  dueDate: z.string().trim().optional().or(z.literal("")),
  requestedBy: z.string().trim().max(120).optional(),
  summary: z.string().trim().min(1).max(400),
  note: z.string().trim().max(2000).optional(),
  relatedDocumentItemIds: z.array(z.string().trim().min(1)).default([])
});

export const updateSupplementRequestSchema = z.object({
  status: z.enum(supplementRequestStatusValues).optional(),
  dueDate: z.string().trim().optional().or(z.literal("")),
  note: z.string().trim().max(2000).optional(),
  summary: z.string().trim().max(400).optional()
});
