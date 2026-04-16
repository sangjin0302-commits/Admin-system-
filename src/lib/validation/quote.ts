import { z } from "zod";

export const createQuoteDraftSchema = z.object({
  create: z.literal(true).optional().default(true)
});

const stageOverrideSchema = z.object({
  percentage: z.number().int().min(0).max(100).optional(),
  dueText: z.string().trim().max(120).optional()
});

export const recalculateQuoteSchema = z.object({
  mode: z.literal("recalculate"),
  selectedServiceLegacyIds: z.array(z.string().trim().min(1)).min(1),
  selectedOptionLegacyIds: z.array(z.string().trim().min(1)).default([]),
  urgencyRuleCode: z.string().trim().min(1),
  consultRuleCode: z.string().trim().min(1),
  paymentRuleCode: z.string().trim().min(1),
  rangeMode: z.boolean().default(true),
  draftNotes: z.string().trim().max(4000).nullish(),
  stageOverrides: z
    .object({
      RETAINER: stageOverrideSchema.optional(),
      MIDTERM: stageOverrideSchema.optional(),
      SUCCESS: stageOverrideSchema.optional()
    })
    .default({})
});

const editableLineSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240).nullish(),
  amountMin: z.number().int().min(0),
  amountMax: z.number().int().min(0),
  sortOrder: z.number().int().min(0)
});

const editableAdjustmentSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240).nullish(),
  computedMin: z.number().int().min(0),
  computedMax: z.number().int().min(0),
  sortOrder: z.number().int().min(0)
});

const editablePaymentPlanSchema = z.object({
  id: z.string().trim().min(1),
  stageKind: z.enum(["RETAINER", "MIDTERM", "SUCCESS"]),
  percentage: z.number().int().min(0).max(100),
  dueText: z.string().trim().min(1).max(120),
  sortOrder: z.number().int().min(0)
});

export const saveQuoteManualEditsSchema = z
  .object({
    mode: z.literal("manual"),
    draftNotes: z.string().trim().max(4000).nullish(),
    specialTerms: z.string().trim().max(6000).nullish(),
    lineItems: z.array(editableLineSchema).min(1),
    adjustments: z.array(editableAdjustmentSchema),
    paymentPlans: z.array(editablePaymentPlanSchema).length(3)
  })
  .refine(
    (value) =>
      value.lineItems.every((line) => line.amountMax >= line.amountMin) &&
      value.adjustments.every((adjustment) => adjustment.computedMax >= adjustment.computedMin),
    {
      message: "범위 금액은 최대 금액이 최소 금액보다 작을 수 없습니다."
    }
  )
  .refine(
    (value) => value.paymentPlans.reduce((sum, plan) => sum + plan.percentage, 0) === 100,
    {
      message: "결제 비율 합계는 100이어야 합니다."
    }
  );

export const createContractDraftSchema = z.object({
  create: z.literal(true).optional().default(true)
});

export const updateQuoteStatusSchema = z.object({
  mode: z.literal("status"),
  status: z.enum(["DRAFT", "READY_TO_SEND", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
  caseDueDate: z.string().trim().optional().or(z.literal("")),
  caseInternalMemo: z.string().trim().max(4000).optional()
});
