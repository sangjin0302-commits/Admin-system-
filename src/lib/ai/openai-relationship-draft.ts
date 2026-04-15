import { z } from "zod";

import { getClientRelationshipWorkspaceForInquiry } from "@/lib/services/client-relationship-service";

const relationshipDraftSchema = z.object({
  followUpStrategy: z.string().trim().min(1).max(700),
  reviewRequest: z.string().trim().min(1).max(500),
  referralRequest: z.string().trim().min(1).max(500),
  reengagementMessage: z.string().trim().min(1).max(500),
  internalNote: z.string().trim().min(1).max(500)
});

function getRelationshipAiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim(),
    model: process.env.OPENAI_RELATIONSHIP_ASSISTANT_MODEL?.trim() || "gpt-4.1-mini",
    enabled: process.env.OPENAI_RELATIONSHIP_ASSISTANT_ENABLED?.trim() !== "false",
    timeoutMs: Number(process.env.OPENAI_RELATIONSHIP_ASSISTANT_TIMEOUT_MS ?? "12000")
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

export async function generateRelationshipAssistantDraft(caseId: string) {
  const config = getRelationshipAiConfig();
  if (!config.enabled || !config.apiKey) {
    throw new Error("OpenAI relationship assistant is not configured.");
  }

  const workspace = await getRelationshipAssistantContext(caseId);
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
                  "You assist a Korean administrative office after case closure. " +
                  "Draft practical customer follow-up language, keeping the tone polite and professional. " +
                  "Do not overpromise. Return only valid JSON."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({ workspace })
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "relationship_assistant_draft",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                followUpStrategy: { type: "string", maxLength: 700 },
                reviewRequest: { type: "string", maxLength: 500 },
                referralRequest: { type: "string", maxLength: 500 },
                reengagementMessage: { type: "string", maxLength: 500 },
                internalNote: { type: "string", maxLength: 500 }
              },
              required: [
                "followUpStrategy",
                "reviewRequest",
                "referralRequest",
                "reengagementMessage",
                "internalNote"
              ]
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI relationship assistant request failed: ${response.status}`);
    }

    const payload = await response.json();
    const outputText = extractResponseText(payload);

    if (!outputText) {
      throw new Error("OpenAI relationship assistant response did not include text output.");
    }

    return relationshipDraftSchema.parse(JSON.parse(outputText));
  } finally {
    clearTimeout(timeout);
  }
}

async function getRelationshipAssistantContext(caseId: string) {
  const prismaModule = await import("@/lib/prisma/client");
  const record = await prismaModule.prisma.caseRecord.findUniqueOrThrow({
    where: { id: caseId },
    select: { inquiryId: true }
  });

  return getClientRelationshipWorkspaceForInquiry(record.inquiryId);
}
