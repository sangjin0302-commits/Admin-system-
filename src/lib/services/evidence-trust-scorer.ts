/**
 * 원본 자료 신뢰도 스코어링.
 *
 * CaseDocument 하나를 대상으로:
 *  - 완결성 (필수 서류 링크·필드 존재)
 *  - 가독성 (OCR 신뢰도 · 파일 크기)
 *  - 일관성 (파일명·docType·업로드 일자)
 *  - 진위 신호 (파일명·MIME 형식)
 *  - 최신성 (문서 날짜 vs 오늘)
 *
 * Claude Haiku 사용, 실패 시 휴리스틱.
 * 저장: SiteSetting key = "evidence.trust.<documentId>"
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const KEY_PREFIX = "evidence.trust.";

export type TrustScore = {
  documentId: string;
  trustScore: number; // 0-1
  gaps: string[];
  concerns: string[];
  recommendations: string[];
  breakdown: {
    completeness: number; // 0-100
    legibility: number;
    consistency: number;
    authenticity: number;
    recency: number;
  };
  source: "ai" | "heuristic";
  scoredAt: string;
};

function trustKey(documentId: string): string {
  return `${KEY_PREFIX}${documentId}`;
}

type DocSnapshot = {
  id: string;
  title: string;
  docType: string;
  status: string;
  hasFile: boolean;
  fileName: string | null;
  mimeType: string | null;
  createdAt: Date;
  receivedAt: Date | null;
  requiredLinked: boolean;
  hasChecksum: boolean;
};

async function loadDoc(documentId: string): Promise<DocSnapshot | null> {
  const row = await prisma.caseDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      title: true,
      docType: true,
      status: true,
      storageKey: true,
      originalFileName: true,
      mimeType: true,
      checksum: true,
      requiredDocId: true,
      createdAt: true,
      receivedAt: true,
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    docType: row.docType,
    status: String(row.status),
    hasFile: Boolean(row.storageKey),
    fileName: row.originalFileName ?? null,
    mimeType: row.mimeType ?? null,
    createdAt: row.createdAt,
    receivedAt: row.receivedAt,
    requiredLinked: Boolean(row.requiredDocId),
    hasChecksum: Boolean(row.checksum),
  };
}

const OFFICIAL_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
]);

function heuristicScore(snap: DocSnapshot): TrustScore {
  const gaps: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];

  // completeness
  let completeness = 60;
  if (snap.hasFile) completeness += 20;
  else gaps.push("첨부 파일 없음");
  if (snap.requiredLinked) completeness += 15;
  else gaps.push("필수 서류 매핑 없음");
  if (!snap.fileName) gaps.push("원본 파일명 정보 부족");
  completeness = Math.max(0, Math.min(100, completeness));

  // legibility (mime · checksum proxy)
  let legibility = 60;
  if (snap.mimeType && OFFICIAL_MIME.has(snap.mimeType)) legibility += 25;
  else if (!snap.mimeType) {
    legibility -= 10;
    concerns.push("MIME 타입 확인 불가");
  }
  if (snap.hasChecksum) legibility += 10;
  legibility = Math.max(0, Math.min(100, legibility));

  // consistency
  let consistency = 65;
  if (snap.fileName && snap.docType) {
    const fn = snap.fileName.toLowerCase();
    if (fn.includes(snap.docType.toLowerCase())) consistency += 15;
  }
  if (snap.status === "REJECTED") {
    consistency -= 25;
    concerns.push("사무소에서 거부 처리된 서류");
  }
  consistency = Math.max(0, Math.min(100, consistency));

  // authenticity signals (파일 확장자 · MIME · title)
  let authenticity = 55;
  if (snap.mimeType?.startsWith("application/pdf")) authenticity += 20;
  else if (snap.mimeType?.startsWith("image/")) authenticity += 10;
  if (/공문|증명|확인서|발급/.test(snap.title)) authenticity += 10;
  if (snap.fileName && /\.(exe|bat|scr)$/i.test(snap.fileName)) {
    authenticity = 5;
    concerns.push("의심스러운 실행 파일 확장자");
  }
  authenticity = Math.max(0, Math.min(100, authenticity));

  // recency
  let recency = 60;
  const baseline = snap.receivedAt ?? snap.createdAt;
  const days = (Date.now() - baseline.getTime()) / (24 * 60 * 60 * 1000);
  if (days < 30) recency = 90;
  else if (days < 180) recency = 70;
  else if (days < 365) recency = 50;
  else {
    recency = 30;
    concerns.push(`발급/수신일이 오래됨 (약 ${Math.round(days / 30)}개월 경과)`);
    recommendations.push("최신 발급본 재요청 검토");
  }

  const trustScore =
    (0.25 * completeness +
      0.2 * legibility +
      0.2 * consistency +
      0.2 * authenticity +
      0.15 * recency) /
    100;

  if (trustScore < 0.5) recommendations.push("의뢰인에게 원본 대체본 또는 보완 서류 요청");
  if (!snap.hasChecksum) recommendations.push("업로드 체크섬 저장으로 무결성 강화");

  return {
    documentId: snap.id,
    trustScore: Math.max(0, Math.min(1, trustScore)),
    gaps,
    concerns,
    recommendations,
    breakdown: {
      completeness: Math.round(completeness),
      legibility: Math.round(legibility),
      consistency: Math.round(consistency),
      authenticity: Math.round(authenticity),
      recency: Math.round(recency),
    },
    source: "heuristic",
    scoredAt: new Date().toISOString(),
  };
}

async function aiScore(apiKey: string, snap: DocSnapshot): Promise<TrustScore | null> {
  const prompt = `You are assessing the trustworthiness of an evidence document uploaded to an administrative agent (행정사) firm.

Return ONLY JSON:
{
  "trustScore": 0-1,
  "gaps": ["..."],
  "concerns": ["..."],
  "recommendations": ["..."],
  "breakdown": {"completeness":0-100,"legibility":0-100,"consistency":0-100,"authenticity":0-100,"recency":0-100}
}

Document:
Title: ${snap.title}
DocType: ${snap.docType}
Status: ${snap.status}
HasFile: ${snap.hasFile ? "yes" : "no"}
FileName: ${snap.fileName ?? "(none)"}
MimeType: ${snap.mimeType ?? "(none)"}
RequiredLinked: ${snap.requiredLinked ? "yes" : "no"}
HasChecksum: ${snap.hasChecksum ? "yes" : "no"}
CreatedAt: ${snap.createdAt.toISOString()}
ReceivedAt: ${snap.receivedAt?.toISOString() ?? "(none)"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  const parsed = JSON.parse(match[0]);
  const clamp01 = (n: unknown) => {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return 0.5;
    return Math.max(0, Math.min(1, v));
  };
  const clamp100 = (n: unknown) => {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return 50;
    return Math.max(0, Math.min(100, Math.round(v)));
  };
  const asStrArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 6) : [];

  const bd = (parsed.breakdown ?? {}) as Record<string, unknown>;
  return {
    documentId: snap.id,
    trustScore: clamp01(parsed.trustScore),
    gaps: asStrArr(parsed.gaps),
    concerns: asStrArr(parsed.concerns),
    recommendations: asStrArr(parsed.recommendations),
    breakdown: {
      completeness: clamp100(bd.completeness),
      legibility: clamp100(bd.legibility),
      consistency: clamp100(bd.consistency),
      authenticity: clamp100(bd.authenticity),
      recency: clamp100(bd.recency),
    },
    source: "ai",
    scoredAt: new Date().toISOString(),
  };
}

export async function getStoredTrustScore(documentId: string): Promise<TrustScore | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: trustKey(documentId) } });
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value);
    if (typeof parsed?.trustScore === "number") return parsed as TrustScore;
    return null;
  } catch {
    return null;
  }
}

async function storeTrust(t: TrustScore): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: trustKey(t.documentId) },
    create: { key: trustKey(t.documentId), value: JSON.stringify(t) },
    update: { value: JSON.stringify(t) },
  });
}

export async function scoreDocumentTrust(documentId: string): Promise<TrustScore> {
  const enabled = await isFeatureEnabled("evidence_trust_score");
  if (!enabled) throw new Error("evidence_trust_score 기능이 비활성화되어 있습니다.");

  const snap = await loadDoc(documentId);
  if (!snap) throw new Error("서류를 찾을 수 없습니다.");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let score: TrustScore | null = null;
  if (apiKey) {
    try {
      score = await aiScore(apiKey, snap);
    } catch (err) {
      logger.warn("[evidence-trust-scorer] AI 실패 — heuristic fallback", err);
    }
  }
  if (!score) score = heuristicScore(snap);

  await storeTrust(score);
  return score;
}

export function trustTone(score: number): { label: string; className: string } {
  if (score >= 0.75) return { label: "높음", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (score >= 0.5) return { label: "보통", className: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: "낮음", className: "bg-red-100 text-red-700 border-red-200" };
}
