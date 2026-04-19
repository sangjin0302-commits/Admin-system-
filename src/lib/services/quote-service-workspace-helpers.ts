import { prisma } from "@/lib/prisma/client";
import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";
import { loadQuoteMasters } from "@/lib/services/quote-computation-helpers";
import { serializeInquiryForQuote } from "@/lib/services/quote-service-core-helpers";
import {
  quoteWithRelationsInclude,
  serializeQuote
} from "@/lib/services/quote-serialization-helpers";
import {
  mapUrgencyLevelToRuleCode,
  suggestServiceLegacyIds
} from "@/lib/quote-engine/legacy-mapping";
import type { QuoteWorkspace } from "@/lib/quote-engine/types";

export async function getQuoteWorkspaceForInquiry(inquiryId: string): Promise<QuoteWorkspace> {
  const [inquiry, masters, latestQuote] = await Promise.all([
    prisma.inquiry.findUniqueOrThrow({ where: { id: inquiryId } }),
    loadQuoteMasters(),
    prisma.quote.findFirst({
      where: { inquiryId },
      orderBy: [{ updatedAt: "desc" }],
      include: quoteWithRelationsInclude
    })
  ]);

  const inquirySnapshot = serializeInquiryForQuote(inquiry);
  const suggestedServiceLegacyIds = suggestServiceLegacyIds(inquirySnapshot, masters.serviceTypes);
  const caseAnalysis = analyzeInquiryCase(inquiry);
  const lawbotAnalysis = await getLawbotCaseAnalysis(inquiry);

  return {
    inquiry: inquirySnapshot,
    caseAnalysis,
    lawbotAnalysis,
    masters: {
      serviceTypes: masters.serviceTypes,
      pricingOptions: masters.pricingOptions,
      urgencyRules: masters.pricingRules.filter((rule) => rule.ruleType === "URGENCY"),
      consultRules: masters.pricingRules.filter((rule) => rule.ruleType === "CONSULT"),
      paymentRules: masters.pricingRules.filter((rule) => rule.ruleType === "PAYMENT"),
      policyRules: masters.pricingRules.filter((rule) => rule.ruleType === "POLICY")
    },
    suggestedServiceLegacyIds,
    suggestedUrgencyRuleCode: mapUrgencyLevelToRuleCode(inquiry.urgencyLevel),
    latestQuote: latestQuote ? serializeQuote(latestQuote) : null
  };
}
