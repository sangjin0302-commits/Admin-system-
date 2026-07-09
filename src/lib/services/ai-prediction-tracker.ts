/**
 * JJJ5 — AI 승소예측 정확도 트래킹.
 *
 * 저장: SiteSetting key = "ai_predictions", value = JSON.stringify(PredictionEntry[])
 * 신뢰도(0..1) 예측이 되고, 사건 종결 시 실제 결과(WON/LOST)를 기록해 정확도를 산출.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const SITE_SETTING_KEY = "ai_predictions";
const MAX_ENTRIES = 5000;

export type PredictionOutcome = "WON" | "LOST";

export type PredictionEntry = {
  caseId: string;
  predictedConfidence: number; // 0..1 — probability of WON
  actualOutcome: PredictionOutcome | null;
  predictedAt: string;
  resolvedAt?: string;
};

export type AccuracyByRange = {
  range: string;
  predictions: number;
  correct: number;
  accuracy: number;
};

export type AccuracySummary = {
  predictions: number;
  correct: number;
  accuracy: number;
  byRange: AccuracyByRange[];
};

async function readAll(): Promise<PredictionEntry[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SITE_SETTING_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed as PredictionEntry[];
  } catch (err) {
    logger.warn("[ai-prediction-tracker] read failed", err);
    return [];
  }
}

async function writeAll(entries: PredictionEntry[]): Promise<void> {
  const trimmed = entries.slice(-MAX_ENTRIES);
  const value = JSON.stringify(trimmed);
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEY },
    create: { key: SITE_SETTING_KEY, value },
    update: { value },
  });
}

export async function storePrediction(entry: PredictionEntry): Promise<void> {
  const entries = await readAll();
  const idx = entries.findIndex((e) => e.caseId === entry.caseId);
  if (idx >= 0) entries[idx] = { ...entries[idx], ...entry };
  else entries.push(entry);
  await writeAll(entries);
}

/**
 * Log a prediction. If actualOutcome is provided, records the final outcome
 * against an earlier prediction (or a fresh entry when none existed).
 */
export async function logPrediction(
  caseId: string,
  predictedConfidence: number,
  actualOutcome?: PredictionOutcome
): Promise<void> {
  const clamped = Math.max(0, Math.min(1, Number(predictedConfidence) || 0));
  const now = new Date().toISOString();
  const entries = await readAll();
  const idx = entries.findIndex((e) => e.caseId === caseId);
  if (idx >= 0) {
    const prev = entries[idx];
    entries[idx] = {
      ...prev,
      predictedConfidence: prev.actualOutcome ? prev.predictedConfidence : clamped,
      actualOutcome: actualOutcome ?? prev.actualOutcome ?? null,
      resolvedAt: actualOutcome ? now : prev.resolvedAt,
    };
  } else {
    entries.push({
      caseId,
      predictedConfidence: clamped,
      actualOutcome: actualOutcome ?? null,
      predictedAt: now,
      resolvedAt: actualOutcome ? now : undefined,
    });
  }
  await writeAll(entries);
}

/** Convenience: record final outcome when a case closes. */
export async function recordCaseOutcome(caseId: string, outcome: PredictionOutcome): Promise<void> {
  const entries = await readAll();
  const idx = entries.findIndex((e) => e.caseId === caseId);
  if (idx < 0) return; // no prediction was made — nothing to score
  entries[idx] = {
    ...entries[idx],
    actualOutcome: outcome,
    resolvedAt: new Date().toISOString(),
  };
  await writeAll(entries);
}

const RANGES: Array<{ label: string; min: number; max: number }> = [
  { label: "0-20%", min: 0, max: 0.2 },
  { label: "20-40%", min: 0.2, max: 0.4 },
  { label: "40-60%", min: 0.4, max: 0.6 },
  { label: "60-80%", min: 0.6, max: 0.8 },
  { label: "80-100%", min: 0.8, max: 1.0001 },
];

export async function computeAccuracy(): Promise<AccuracySummary> {
  const entries = (await readAll()).filter((e) => e.actualOutcome != null);
  let correct = 0;
  const byRange: AccuracyByRange[] = RANGES.map((r) => ({
    range: r.label,
    predictions: 0,
    correct: 0,
    accuracy: 0,
  }));

  for (const e of entries) {
    const predictedWon = e.predictedConfidence >= 0.5;
    const actualWon = e.actualOutcome === "WON";
    const isCorrect = predictedWon === actualWon;
    if (isCorrect) correct += 1;

    const rangeIdx = RANGES.findIndex(
      (r) => e.predictedConfidence >= r.min && e.predictedConfidence < r.max
    );
    if (rangeIdx >= 0) {
      byRange[rangeIdx].predictions += 1;
      if (isCorrect) byRange[rangeIdx].correct += 1;
    }
  }

  for (const r of byRange) {
    r.accuracy = r.predictions > 0 ? r.correct / r.predictions : 0;
  }

  const total = entries.length;
  return {
    predictions: total,
    correct,
    accuracy: total > 0 ? correct / total : 0,
    byRange,
  };
}

export async function listRecentPredictions(limit = 100): Promise<PredictionEntry[]> {
  const entries = await readAll();
  return entries.slice(-limit).reverse();
}
