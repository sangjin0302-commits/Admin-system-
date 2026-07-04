/**
 * 문서 OCR + 자동 분류 (Anthropic Vision — Claude Sonnet).
 *
 * ANTHROPIC_API_KEY 필요. 미설정 시 fallback (ocr-service.ts 의 mock/Google Vision) 텍스트만 사용하고
 * 분류는 keyword 기반 heuristic 으로 대체합니다.
 */

import { extractText } from "@/lib/services/ocr-service";
import { logger } from "@/lib/utils/logger";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const VISION_MODEL = "claude-sonnet-4-5-20250929";

export type DocumentType =
  | "여권"
  | "비자"
  | "주민등록등본"
  | "가족관계증명서"
  | "계약서"
  | "판결문"
  | "기타";

export const DOCUMENT_TYPES: DocumentType[] = [
  "여권",
  "비자",
  "주민등록등본",
  "가족관계증명서",
  "계약서",
  "판결문",
  "기타",
];

export type DocumentOcrResult = {
  text: string;
  type: DocumentType;
  confidence: number;
  reason?: string;
  fields?: Record<string, string>;
  usedVision: boolean;
};

// ── Heuristic fallback classification ──────────────────────────
export function classifyByKeywords(text: string): { type: DocumentType; confidence: number; reason: string } {
  const t = text || "";
  const rules: Array<{ type: DocumentType; keywords: RegExp; weight: number }> = [
    { type: "여권", keywords: /passport|여권|P<[A-Z]{3}|Republic of Korea/i, weight: 0.9 },
    { type: "비자", keywords: /VISA|사증|Visa Type|체류자격|residence/i, weight: 0.85 },
    { type: "주민등록등본", keywords: /주민등록등본|세대주|주민등록번호/i, weight: 0.9 },
    { type: "가족관계증명서", keywords: /가족관계|가족관계증명|본인란/i, weight: 0.9 },
    { type: "계약서", keywords: /계약서|계약자|甲|乙|Contract|Agreement/i, weight: 0.8 },
    { type: "판결문", keywords: /판결|주문|이유|법원|원고|피고|재판장/i, weight: 0.85 },
  ];
  let best: { type: DocumentType; confidence: number; reason: string } = {
    type: "기타",
    confidence: 0.4,
    reason: "keyword match not found",
  };
  for (const r of rules) {
    if (r.keywords.test(t)) {
      if (r.weight > best.confidence) {
        best = { type: r.type, confidence: r.weight, reason: `keyword: ${String(r.keywords)}` };
      }
    }
  }
  return best;
}

// ── Vision API call ────────────────────────────────────────────

const VISION_SYSTEM =
  "너는 한국 행정 문서 OCR/분류 전문가다. 이미지에서 (1) 모든 텍스트를 정확히 추출하고, " +
  "(2) 문서 유형을 다음 중 하나로 분류한다: 여권 | 비자 | 주민등록등본 | 가족관계증명서 | 계약서 | 판결문 | 기타. " +
  "다음 JSON 스키마로만 응답: {\"text\": \"...\", \"type\": \"...\", \"confidence\": 0.0-1.0, \"reason\": \"...\", \"fields\": {...}}. " +
  "fields 에는 문서 유형별 주요 항목(예: 여권=성명/여권번호/국적/발급일, 비자=사증종류/체류기간, 판결문=사건번호/법원/주문)을 넣어라. " +
  "마크다운 코드펜스 금지. JSON 외 텍스트 금지.";

async function callVisionApi(
  imageBase64: string,
  mimeType: string
): Promise<DocumentOcrResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // Strip data URI prefix if present
  const base64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
  const cleanMime = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)
    ? mimeType
    : "image/jpeg";

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 3000,
        system: VISION_SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: cleanMime, data: base64 },
              },
              {
                type: "text",
                text: "이 문서를 OCR + 분류하라. JSON만 출력.",
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.warn("[document-ocr] vision api error", { status: res.status, body: errText.slice(0, 400) });
      return null;
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const raw = data.content?.find((c) => c.type === "text")?.text ?? "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as {
      text?: string;
      type?: string;
      confidence?: number;
      reason?: string;
      fields?: Record<string, string>;
    };
    const type = (DOCUMENT_TYPES as string[]).includes(parsed.type ?? "")
      ? (parsed.type as DocumentType)
      : "기타";
    return {
      text: typeof parsed.text === "string" ? parsed.text : "",
      type,
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.7,
      reason: parsed.reason,
      fields: parsed.fields,
      usedVision: true,
    };
  } catch (err) {
    logger.warn("[document-ocr] vision call failed", err);
    return null;
  }
}

// ── Main entry ─────────────────────────────────────────────────

export type OcrDocumentInput = {
  /** Base64-encoded image (data URI or raw base64). */
  imageBase64?: string;
  /** Alternative: Buffer/Uint8Array-like. */
  imageBuffer?: Buffer | Uint8Array;
  mimeType?: string;
};

function toBase64(input: OcrDocumentInput): string {
  if (input.imageBase64) return input.imageBase64;
  if (input.imageBuffer) return Buffer.from(input.imageBuffer).toString("base64");
  return "";
}

export async function ocrDocument(input: OcrDocumentInput): Promise<DocumentOcrResult> {
  const base64 = toBase64(input);
  const mimeType = input.mimeType || "image/jpeg";
  if (!base64) {
    return { text: "", type: "기타", confidence: 0, reason: "no image", usedVision: false };
  }

  const vision = await callVisionApi(base64, mimeType);
  if (vision) return vision;

  // Fallback: existing OCR + keyword heuristic
  const ocr = await extractText(base64, mimeType);
  const cls = classifyByKeywords(ocr.text);
  return {
    text: ocr.text,
    type: cls.type,
    confidence: cls.confidence,
    reason: cls.reason,
    usedVision: false,
  };
}

// Overload for callers that only have a Buffer
export async function ocrDocumentBuffer(
  imageBuffer: Buffer | Uint8Array,
  mimeType = "image/jpeg"
): Promise<DocumentOcrResult> {
  return ocrDocument({ imageBuffer, mimeType });
}
