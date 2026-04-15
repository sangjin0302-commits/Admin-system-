import { z } from "zod";

import { getCaseWorkspaceForInquiry } from "@/lib/services/case-service";
import { getSubmissionWorkspace } from "@/lib/services/submission-service";

const caseBriefSchema = z.object({
  caseSummary: z.string().trim().min(1).max(700),
  keyRisks: z.string().trim().min(1).max(700),
  nextActions: z.string().trim().min(1).max(700),
  clientUpdateDraft: z.string().trim().min(1).max(700),
  internalPriorityMemo: z.string().trim().min(1).max(500)
});

function getCaseAiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim(),
    model: process.env.OPENAI_CASE_ASSISTANT_MODEL?.trim() || "gpt-4.1-mini",
    enabled: process.env.OPENAI_CASE_ASSISTANT_ENABLED?.trim() !== "false",
    timeoutMs: Number(process.env.OPENAI_CASE_ASSISTANT_TIMEOUT_MS ?? "12000")
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

export async function generateCaseAssistantBrief(caseId: string) {
  const config = getCaseAiConfig();
  if (!config.enabled || !config.apiKey) {
    throw new Error("OpenAI case assistant is not configured.");
  }

  const context = await getCaseAssistantContext(caseId);
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
                  "You assist a Korean administrative office with case operations. " +
                  "Summarize the case, identify operational risks, and draft a calm client update. " +
                  "Do not promise legal outcomes. Return only valid JSON."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(context)
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "case_assistant_brief",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                caseSummary: { type: "string", maxLength: 700 },
                keyRisks: { type: "string", maxLength: 700 },
                nextActions: { type: "string", maxLength: 700 },
                clientUpdateDraft: { type: "string", maxLength: 700 },
                internalPriorityMemo: { type: "string", maxLength: 500 }
              },
              required: [
                "caseSummary",
                "keyRisks",
                "nextActions",
                "clientUpdateDraft",
                "internalPriorityMemo"
              ]
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI case assistant request failed: ${response.status}`);
    }

    const payload = await response.json();
    const outputText = extractResponseText(payload);

    if (!outputText) {
      throw new Error("OpenAI case assistant response did not include text output.");
    }

    return caseBriefSchema.parse(JSON.parse(outputText));
  } finally {
    clearTimeout(timeout);
  }
}

async function getCaseAssistantContext(caseId: string) {
  const prismaModule = await import("@/lib/prisma/client");
  const record = await prismaModule.prisma.caseRecord.findUniqueOrThrow({
    where: { id: caseId },
    select: { inquiryId: true }
  });

  const caseWorkspace = await getCaseWorkspaceForInquiry(record.inquiryId);
  const submissionWorkspace = await getSubmissionWorkspace(caseId);

  return {
    caseWorkspace,
    submissionWorkspace
  };
}
