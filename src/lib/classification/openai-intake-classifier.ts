import { z } from "zod";

import type { InquiryType, UrgencyLevel } from "@/types/inquiry";

import type { ClassificationInput, ClassificationResult } from "./types";

const openAiClassificationSchema = z.object({
  inquiryType: z.enum([
    "FOREIGNER_VISA",
    "IMMIGRATION_STAY",
    "APOSTILLE_CONSULAR",
    "TRANSLATION_NOTARY",
    "GENERAL_ADMIN_CIVIL",
    "CORPORATE_REQUEST",
    "UNKNOWN"
  ]),
  urgencyLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  confidence: z.number().min(0).max(1),
  qualificationScore: z.number().min(0).max(100),
  serviceTags: z.array(z.string().trim().min(1).max(40)).max(8),
  classificationReason: z.string().trim().min(1).max(600),
  recommendedNextStep: z.string().trim().min(1).max(400)
});

function getOpenAiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim(),
    model: process.env.OPENAI_CLASSIFIER_MODEL?.trim() || "gpt-4.1-mini",
    enabled: process.env.OPENAI_CLASSIFIER_ENABLED?.trim() !== "false",
    minConfidence: Number(process.env.OPENAI_CLASSIFIER_MIN_CONFIDENCE ?? "0.72"),
    timeoutMs: Number(process.env.OPENAI_CLASSIFIER_TIMEOUT_MS ?? "10000")
  };
}

function buildClassificationPrompt(input: ClassificationInput) {
  return {
    clientType: input.clientType,
    contactName: input.contactName,
    email: input.email,
    organizationName: input.organizationName ?? null,
    title: input.title,
    description: input.description,
    nationality: input.nationality ?? null,
    currentStatus: input.currentStatus ?? null,
    documentCountry: input.documentCountry ?? null,
    targetAgency: input.targetAgency ?? null,
    dueDate: input.dueDate?.toISOString() ?? null,
    preferredLanguage: input.preferredLanguage
  };
}

function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
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

function normalizeResult(result: z.infer<typeof openAiClassificationSchema>): ClassificationResult {
  return {
    inquiryType: result.inquiryType as InquiryType,
    urgencyLevel: result.urgencyLevel as UrgencyLevel,
    confidence: result.confidence,
    qualificationScore: Math.round(result.qualificationScore),
    serviceTags: Array.from(new Set(result.serviceTags.map((entry) => entry.trim()).filter(Boolean))),
    classificationReason: result.classificationReason,
    recommendedNextStep: result.recommendedNextStep
  };
}

export async function classifyInquiryWithOpenAI(
  input: ClassificationInput
): Promise<ClassificationResult | null> {
  const config = getOpenAiConfig();

  if (!config.enabled || !config.apiKey) {
    return null;
  }

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
                  "You classify incoming administrative service inquiries for a Korean administrative office. " +
                  "Return only valid JSON that matches the schema. " +
                  "Choose inquiryType from the enum exactly. " +
                  "Use HIGH or CRITICAL urgency if the due date is near, status may expire soon, or the user asks for urgent action. " +
                  "classificationReason should be concise and factual. " +
                  "recommendedNextStep should be one sentence in the user's preferred language when possible."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(buildClassificationPrompt(input))
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "intake_classification",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                inquiryType: {
                  type: "string",
                  enum: [
                    "FOREIGNER_VISA",
                    "IMMIGRATION_STAY",
                    "APOSTILLE_CONSULAR",
                    "TRANSLATION_NOTARY",
                    "GENERAL_ADMIN_CIVIL",
                    "CORPORATE_REQUEST",
                    "UNKNOWN"
                  ]
                },
                urgencyLevel: {
                  type: "string",
                  enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                qualificationScore: { type: "number", minimum: 0, maximum: 100 },
                serviceTags: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 8
                },
                classificationReason: { type: "string", maxLength: 600 },
                recommendedNextStep: { type: "string", maxLength: 400 }
              },
              required: [
                "inquiryType",
                "urgencyLevel",
                "confidence",
                "qualificationScore",
                "serviceTags",
                "classificationReason",
                "recommendedNextStep"
              ]
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI classification request failed: ${response.status}`);
    }

    const payload = await response.json();
    const outputText = extractResponseText(payload);

    if (!outputText) {
      throw new Error("OpenAI classification response did not include text output.");
    }

    const parsed = openAiClassificationSchema.parse(JSON.parse(outputText));

    if (parsed.confidence < config.minConfidence) {
      return null;
    }

    return normalizeResult(parsed);
  } catch (error) {
    console.error("OpenAI inquiry classification failed, falling back to rule-based logic.", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
