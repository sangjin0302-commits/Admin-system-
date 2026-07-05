/**
 * 메신저 (텔레그램·카카오) 자동 접수 봇.
 *
 * 인바운드 텍스트 → Claude Haiku 로 필드 추출 → Inquiry 자동 생성.
 * 신뢰도 낮으면 PENDING_REVIEW 로 표시(SiteSetting 큐에 저장).
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const PENDING_KEY_PREFIX = "messenger.pending.";
const PENDING_INDEX_KEY = "messenger.pending.index";
const CONFIDENCE_THRESHOLD = 0.6;

export type MessengerSource = "telegram" | "kakao";

export type ExtractedFields = {
  name: string | null;
  phone: string | null;
  category: string | null;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  confidence: number;
};

export type IntakeResult =
  | { status: "created"; inquiryId: string; confidence: number; fields: ExtractedFields }
  | { status: "pending_review"; pendingId: string; confidence: number; fields: ExtractedFields; rawText: string }
  | { status: "rejected"; reason: string };

const CATEGORY_MAP: Record<string, string> = {
  VISA_STAY: "체류·비자",
  NATURALIZATION: "귀화",
  CORPORATE_REQUEST: "법인",
  GENERAL_ADMIN_CIVIL: "민원",
  ADMIN_APPEAL: "행정심판",
  APOSTILLE_CONSULAR: "아포스티유",
  FOREIGNER_VISA: "외국인 비자",
  IMMIGRATION_STAY: "출입국·체류",
};

function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 9 || digits.length > 12) return null;
  return digits;
}

function keywordFallback(text: string): ExtractedFields {
  const nameM = text.match(/([가-힣]{2,4})\s*(입니다|이라고|이에요|예요|드립니다)/);
  const phoneM = text.match(/(\+?82[-\s]?)?(0?1[016789])[-\s]?(\d{3,4})[-\s]?(\d{4})/);
  const phone = phoneM ? normalizePhone(phoneM[0]) : null;

  let category: string | null = null;
  for (const [key, label] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(label) || text.includes(key.toLowerCase())) {
      category = key;
      break;
    }
  }

  let urgency: ExtractedFields["urgency"] = "MEDIUM";
  if (/(급함|긴급|오늘|내일|당장|urgent)/i.test(text)) urgency = "HIGH";
  if (/(매우 급함|극도로|즉시|당일)/i.test(text)) urgency = "CRITICAL";
  if (/(여유|천천히|나중|다음달)/.test(text)) urgency = "LOW";

  return {
    name: nameM?.[1] ?? null,
    phone,
    category,
    urgency,
    summary: text.slice(0, 500),
    confidence: 0.35, // 휴리스틱은 낮은 신뢰도
  };
}

async function aiExtract(text: string): Promise<ExtractedFields | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const prompt = `You extract inquiry fields from a Korean messenger message to a 행정사(administrative agent) firm.
Return JSON only. Schema:
{ "name": string|null, "phone": string|null,
  "category": "VISA_STAY"|"NATURALIZATION"|"CORPORATE_REQUEST"|"GENERAL_ADMIN_CIVIL"|"ADMIN_APPEAL"|"APOSTILLE_CONSULAR"|"FOREIGNER_VISA"|"IMMIGRATION_STAY"|null,
  "urgency": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
  "summary": "한국어 1-2문장 요약",
  "confidence": 0.0-1.0 }

Message:
"""
${text.slice(0, 2000)}
"""`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.content?.[0]?.text ?? "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    const validUrgency = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
    const urgency = validUrgency.has(parsed.urgency) ? parsed.urgency : "MEDIUM";
    const confidence = typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;
    return {
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : null,
      phone: normalizePhone(typeof parsed.phone === "string" ? parsed.phone : null),
      category: typeof parsed.category === "string" && parsed.category in CATEGORY_MAP ? parsed.category : null,
      urgency,
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 500) : text.slice(0, 500),
      confidence,
    };
  } catch (err) {
    logger.warn("[messenger-intake] AI 추출 실패", err);
    return null;
  }
}

async function readPendingIndex(): Promise<string[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: PENDING_INDEX_KEY } });
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

async function writePendingIndex(ids: string[]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: PENDING_INDEX_KEY },
    create: { key: PENDING_INDEX_KEY, value: JSON.stringify(ids) },
    update: { value: JSON.stringify(ids) },
  });
}

export type PendingIntake = {
  id: string;
  source: MessengerSource;
  rawText: string;
  fields: ExtractedFields;
  confidence: number;
  createdAt: string;
  status: "PENDING_REVIEW";
};

async function storePending(
  source: MessengerSource,
  rawText: string,
  fields: ExtractedFields,
): Promise<string> {
  const id = `pi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const record: PendingIntake = {
    id,
    source,
    rawText: rawText.slice(0, 4000),
    fields,
    confidence: fields.confidence,
    createdAt: new Date().toISOString(),
    status: "PENDING_REVIEW",
  };
  await prisma.siteSetting.upsert({
    where: { key: `${PENDING_KEY_PREFIX}${id}` },
    create: { key: `${PENDING_KEY_PREFIX}${id}`, value: JSON.stringify(record) },
    update: { value: JSON.stringify(record) },
  });
  const index = await readPendingIndex();
  await writePendingIndex([id, ...index].slice(0, 200));
  return id;
}

export async function listPendingIntakes(): Promise<PendingIntake[]> {
  const ids = await readPendingIndex();
  if (ids.length === 0) return [];
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ids.map((id) => `${PENDING_KEY_PREFIX}${id}`) } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value] as const));
  const out: PendingIntake[] = [];
  for (const id of ids) {
    const v = map.get(`${PENDING_KEY_PREFIX}${id}`);
    if (!v) continue;
    try {
      out.push(JSON.parse(v) as PendingIntake);
    } catch {
      /* skip */
    }
  }
  return out;
}

export async function removePendingIntake(id: string): Promise<void> {
  await prisma.siteSetting.deleteMany({ where: { key: `${PENDING_KEY_PREFIX}${id}` } });
  const ids = await readPendingIndex();
  await writePendingIndex(ids.filter((x) => x !== id));
}

async function createInquiryFromFields(
  source: MessengerSource,
  fields: ExtractedFields,
  rawText: string,
): Promise<string> {
  const inquiry = await prisma.inquiry.create({
    data: {
      contactName: fields.name ?? "미상",
      email: `${source}-${Date.now()}@messenger.intake.local`,
      phone: fields.phone,
      title: `[${source}] ${fields.summary.slice(0, 40)}`,
      description: rawText.slice(0, 4000),
      intakeSource: "messenger_bot",
      intakeChannel: source,
      intakeCategory: fields.category,
      urgencyLevel: fields.urgency,
      declaredUrgency: fields.urgency,
      internalMemo: `자동 접수 (${source}) · 신뢰도 ${(fields.confidence * 100).toFixed(0)}%\n${fields.summary}`,
      generatedSummary: fields.summary,
      generatedGuidance: "",
      generatedReceiptMessage: "",
      classificationReason: `messenger-bot(${source}) 자동 분류 (신뢰도 ${fields.confidence.toFixed(2)})`,
      recommendedNextStep: "관리자 검토 후 상담 진행",
    },
    select: { id: true },
  });
  return inquiry.id;
}

/**
 * 텍스트 하나를 처리해 Inquiry 를 만들거나 PENDING 큐에 넣습니다.
 */
export async function processIncomingMessage(
  source: MessengerSource,
  rawText: string,
): Promise<IntakeResult> {
  const trimmed = rawText?.trim() ?? "";
  if (!trimmed) return { status: "rejected", reason: "빈 메시지" };
  if (trimmed.length < 10) return { status: "rejected", reason: "너무 짧은 메시지" };

  const ai = await aiExtract(trimmed);
  const fields = ai ?? keywordFallback(trimmed);

  if (fields.confidence < CONFIDENCE_THRESHOLD) {
    const pendingId = await storePending(source, trimmed, fields);
    logger.info("[messenger-intake] PENDING_REVIEW", { source, pendingId, confidence: fields.confidence });
    return { status: "pending_review", pendingId, confidence: fields.confidence, fields, rawText: trimmed };
  }

  try {
    const inquiryId = await createInquiryFromFields(source, fields, trimmed);
    logger.info("[messenger-intake] Inquiry 생성", { source, inquiryId, confidence: fields.confidence });
    return { status: "created", inquiryId, confidence: fields.confidence, fields };
  } catch (err) {
    logger.error("[messenger-intake] Inquiry 생성 실패", err);
    const pendingId = await storePending(source, trimmed, fields);
    return { status: "pending_review", pendingId, confidence: fields.confidence, fields, rawText: trimmed };
  }
}

/** PENDING → 승인 → 실제 Inquiry 로 승격. */
export async function approvePendingIntake(id: string, overrides?: Partial<ExtractedFields>): Promise<string> {
  const row = await prisma.siteSetting.findUnique({ where: { key: `${PENDING_KEY_PREFIX}${id}` } });
  if (!row?.value) throw new Error("PENDING 항목을 찾을 수 없습니다.");
  const pending = JSON.parse(row.value) as PendingIntake;
  const merged: ExtractedFields = { ...pending.fields, ...(overrides ?? {}) };
  const inquiryId = await createInquiryFromFields(pending.source, merged, pending.rawText);
  await removePendingIntake(id);
  return inquiryId;
}

export function getCategoryLabel(key: string | null): string {
  if (!key) return "-";
  return CATEGORY_MAP[key] ?? key;
}
