import { getNotionReferenceRecommendations } from "@/lib/integrations/notion";
import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";
import { getInquiryById } from "@/lib/services/inquiry-service";
import { getInquiryReceiptCode } from "@/lib/services/inquiry-receipt-code";
import { getQuoteWorkspaceForInquiry } from "@/lib/services/quote-service";
import { parseJsonArray } from "@/lib/utils";
import { type InquiryType } from "@/types/inquiry";
import { logger } from "@/lib/utils/logger";

type InquiryDetailRecord = NonNullable<Awaited<ReturnType<typeof getInquiryById>>>;

export type QuoteWorkspaceResult = Awaited<ReturnType<typeof getQuoteWorkspaceForInquiry>>;
export type ReferenceRecommendationsResult = Awaited<ReturnType<typeof getNotionReferenceRecommendations>>;

export async function safeGetQuoteWorkspace(inquiry: InquiryDetailRecord): Promise<QuoteWorkspaceResult> {
  try {
    return await getQuoteWorkspaceForInquiry(inquiry.id);
  } catch (error) {
    logger.error("Failed to load quote workspace", error);
    return {
      inquiry: {
        id: inquiry.id,
        title: inquiry.title,
        description: inquiry.description,
        inquiryType: inquiry.inquiryType,
        urgencyLevel: inquiry.urgencyLevel,
        preferredLanguage: inquiry.preferredLanguage,
        contactName: inquiry.contactName,
        organizationName: inquiry.organizationName,
        email: inquiry.email,
        phone: inquiry.phone,
        classificationReason: inquiry.classificationReason,
        serviceTags: parseJsonArray(inquiry.serviceTags).map((entry) => String(entry)),
        hasPreparedDocuments: inquiry.hasPreparedDocuments,
        needsTranslation: inquiry.needsTranslation,
        isCorporateRequest: inquiry.isCorporateRequest,
        consultationRequired: inquiry.consultationRequired,
        createdAt: inquiry.createdAt.toISOString(),
        updatedAt: inquiry.updatedAt.toISOString()
      },
      caseAnalysis: analyzeInquiryCase(inquiry),
      lawbotAnalysis: {
        status: "error",
        message: "Failed to load Lawbot analysis for quote workspace.",
        outcome: {
          status: "failed",
          reasonCode: "network_error"
        }
      },
      masters: {
        serviceTypes: [],
        pricingOptions: [],
        urgencyRules: [],
        consultRules: [],
        paymentRules: [],
        policyRules: []
      },
      suggestedServiceLegacyIds: [],
      suggestedUrgencyRuleCode: "",
      latestQuote: null
    } as QuoteWorkspaceResult;
  }
}

export async function safeGetLawbotAnalysis(inquiry: InquiryDetailRecord) {
  try {
    return await getLawbotCaseAnalysis(inquiry);
  } catch (error) {
    logger.error("Failed to load lawbot analysis", error);
    return {
      status: "error" as const,
      message: "Failed to load Lawbot analysis. Continue with internal checklist first.",
      outcome: {
        status: "failed" as const,
        reasonCode: "network_error" as const
      }
    };
  }
}

export async function safeGetReferenceRecommendations(input: {
  inquiryType: InquiryType;
  serviceTags: string[];
  inquiryTitle: string;
}): Promise<ReferenceRecommendationsResult> {
  try {
    return await getNotionReferenceRecommendations(input);
  } catch (error) {
    logger.error("Failed to load Notion reference recommendations", error);
    return {
      keywords: [],
      materials: [],
      websites: []
    } as ReferenceRecommendationsResult;
  }
}

export async function safeGetInquiryForDetail(id: string) {
  try {
    return {
      inquiry: await getInquiryById(id),
      errorMessage: null as string | null
    };
  } catch (error) {
    logger.error("Failed to load inquiry detail", error);
    return {
      inquiry: null,
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function safeGetInquiryReceiptCode(input: {
  id: string;
  createdAt: Date;
  inquiryType: InquiryType;
}) {
  try {
    return await getInquiryReceiptCode(input);
  } catch (error) {
    logger.error("Failed to create inquiry receipt code", error);
    const datePart = input.createdAt.toISOString().slice(2, 10).replace(/-/g, "");
    return `${datePart}-ERR-${input.id.slice(0, 6).toUpperCase()}`;
  }
}
