import { prisma } from "@/lib/prisma/client";
import type { QuoteWithRelations } from "@/lib/services/quote-serialization-helpers";

export type QuoteLineItemRecord = QuoteWithRelations["lineItems"][number];
export type QuotePaymentPlanRecord = QuoteWithRelations["paymentPlans"][number];

export type QuoteWorkflowDbClient = Pick<typeof prisma, "contractDraft" | "caseRecord">;
