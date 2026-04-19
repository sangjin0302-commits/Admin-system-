import { prisma } from "@/lib/prisma/client";
import {
  quoteWithRelationsInclude,
  type QuoteWithRelations
} from "@/lib/services/quote-serialization-helpers";

export async function getQuoteByIdOrThrow(quoteId: string): Promise<QuoteWithRelations> {
  return prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: quoteWithRelationsInclude
  });
}
