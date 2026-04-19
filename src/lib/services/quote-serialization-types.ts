import type { Prisma } from "@generated/prisma-client/client";

export const quoteWithRelationsInclude = {
  inquiry: true,
  lineItems: true,
  adjustments: true,
  paymentPlans: true,
  contractDraft: true,
  caseRecord: true
} as const satisfies Prisma.QuoteInclude;

export type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: typeof quoteWithRelationsInclude;
}>;
