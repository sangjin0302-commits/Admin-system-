import { z } from "zod";

import { getQuoteWorkspaceForInquiry } from "@/lib/services/quote-service";

const quoteDraftSchema = z.object({
  proposalHeadline: z.string().trim().min(1).max(120),
  customerSummary: z.string().trim().min(1).max(500),
  scopeSummary: z.string().trim().min(1).max(900),
  nextStepGuide: z.string().trim().min(1).max(500),
  internalMemo: z.string().trim().min(1).max(600)
});

function getQuoteAiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim(),
    model: process.env.OPENAI_QUOTE_ASSISTANT_MODEL?.trim() || "gpt-4.1-mini",
    enabled: process.env.OPENAI_QUOTE_ASSISTANT_ENABLED?.trim() !== "false",
    timeoutMs: Number(process.env.OPENAI_QUOTE_ASSISTANT_TIMEOUT_MS ?? "12000")
  };
}

function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text;
  }

  for (const item of record.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string" && content.text.trim()) {
        return content.text;
      }
    }
  }

  return null;
}

export async function generateQuoteAssistantDraft(quoteId: string) {
  const config = getQuoteAiConfig();
  if (!config.enabled || !config.apiKey) {
    throw new Error("OpenAI quote assistant is not configured.");
  }

  const quote = await getQuoteWorkspaceForQuoteId(quoteId);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text:
                  "You are assisting a Korean administrative office. " +
                  "Draft a concise proposal summary for internal use and customer communication. " +
                  "Do not promise outcomes. Keep the tone practical, calm, and professional. " +
                  "Return only valid JSON."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  inquiry: quote.workspace.inquiry,
                  latestQuote: quote.workspace.latestQuote
                    ? {
                        status: quote.workspace.latestQuote.status,
                        totalMin: quote.workspace.latestQuote.totalMin,
                        totalMax: quote.workspace.latestQuote.totalMax,
                        consultFee: quote.workspace.latestQuote.consultFee,
                        calculationSummary: quote.workspace.latestQuote.calculationSummary,
                        lineItems: quote.workspace.latestQuote.lineItems.map((item) => ({
                          label: item.label,
                          description: item.description,
                          amountMin: item.amountMin,
                          amountMax: item.amountMax
                        })),
                        paymentPlans: quote.workspace.latestQuote.paymentPlans.map((plan) => ({
                          stageKind: plan.stageKind,
                          percentage: plan.percentage,
                          dueText: plan.dueText,
                          amountMin: plan.amountMin,
                          amountMax: plan.amountMax
                        }))
                      }
                    : null
                })
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "quote_assistant_draft",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                proposalHeadline: { type: "string", maxLength: 120 },
                customerSummary: { type: "string", maxLength: 500 },
                scopeSummary: { type: "string", maxLength: 900 },
                nextStepGuide: { type: "string", maxLength: 500 },
                internalMemo: { type: "string", maxLength: 600 }
              },
              required: [
                "proposalHeadline",
                "customerSummary",
                "scopeSummary",
                "nextStepGuide",
                "internalMemo"
              ]
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI quote assistant request failed: ${response.status}`);
    }

    const payload = await response.json();
    const outputText = extractResponseText(payload);

    if (!outputText) {
      throw new Error("OpenAI quote assistant response did not include text output.");
    }

    return quoteDraftSchema.parse(JSON.parse(outputText));
  } finally {
    clearTimeout(timeout);
  }
}

async function getQuoteWorkspaceForQuoteId(quoteId: string) {
  const prismaModule = await import("@/lib/prisma/client");
  const quote = await prismaModule.prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    select: { inquiryId: true }
  });

  return {
    inquiryId: quote.inquiryId,
    workspace: await getQuoteWorkspaceForInquiry(quote.inquiryId)
  };
}
