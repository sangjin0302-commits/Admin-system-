/**
 * 혼돈 공학 실험 (안전 모드) — 지연·오류를 의도적으로 주입.
 *
 * 안전장치:
 *   - process.env.NODE_ENV === "production" 인 경우, CHAOS_ALLOW_PROD=1 이 없으면 **모든 주입 no-op**.
 *   - 플래그 `chaos_engineering` 이 꺼져 있으면 no-op.
 *
 * 저장:
 *   - SiteSetting `chaos.experiments` : ChaosExperiment[]
 *   - SiteSetting `chaos.log` : 주입 이벤트 로그 (최근 200)
 */

import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const EXPERIMENTS_KEY = "chaos.experiments";
const LOG_KEY = "chaos.log";
const MAX_LOG = 200;

export type ChaosAction = "delay" | "error" | "slow";
export type ChaosExperiment = {
  id: string;
  target: string; // 서비스/함수/라우트 식별자
  action: ChaosAction;
  intensity: number; // delay: ms · slow: 배수 · error: 확률 0..1
  probability: number; // 0..1 매 호출마다 주입 확률
  schedule?: string; // cron 표현 또는 "always"
  enabled: boolean;
};

export type ChaosLogEntry = {
  id: string;
  at: string;
  target: string;
  action: ChaosAction;
  detail: string;
};

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: json },
    update: { value: json },
  });
}

/** 프로덕션에서 실행이 허용되는가? */
export function isProdChaosAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.CHAOS_ALLOW_PROD === "1";
}

async function isChaosActive(): Promise<boolean> {
  if (!isProdChaosAllowed()) return false;
  try {
    return await isFeatureEnabled("chaos_engineering");
  } catch {
    return false;
  }
}

export async function listExperiments(): Promise<ChaosExperiment[]> {
  return readJson<ChaosExperiment[]>(EXPERIMENTS_KEY, []);
}

export async function upsertExperiment(exp: ChaosExperiment): Promise<ChaosExperiment> {
  const list = await listExperiments();
  const idx = list.findIndex((e) => e.id === exp.id);
  const next: ChaosExperiment = {
    ...exp,
    id: exp.id || newId("chaos"),
    intensity: Math.max(0, exp.intensity),
    probability: Math.max(0, Math.min(1, exp.probability)),
  };
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  await writeJson(EXPERIMENTS_KEY, list);
  return next;
}

export async function removeExperiment(id: string): Promise<void> {
  const list = await listExperiments();
  await writeJson(EXPERIMENTS_KEY, list.filter((e) => e.id !== id));
}

export async function getChaosLog(): Promise<ChaosLogEntry[]> {
  return readJson<ChaosLogEntry[]>(LOG_KEY, []);
}

async function pushLog(entry: ChaosLogEntry): Promise<void> {
  const list = await getChaosLog();
  list.push(entry);
  await writeJson(LOG_KEY, list.slice(-MAX_LOG));
}

async function pickExperiment(target: string, action: ChaosAction): Promise<ChaosExperiment | null> {
  if (!(await isChaosActive())) return null;
  const list = await listExperiments();
  const candidates = list.filter((e) => e.enabled && e.target === target && e.action === action);
  for (const exp of candidates) {
    if (Math.random() < exp.probability) return exp;
  }
  return null;
}

/** 지연 주입 — 실험 매칭 시 `intensity` ms 대기. */
export async function maybeInjectDelay(target: string): Promise<void> {
  const exp = await pickExperiment(target, "delay");
  if (!exp) return;
  await new Promise((resolve) => setTimeout(resolve, exp.intensity));
  await pushLog({
    id: newId("log"),
    at: new Date().toISOString(),
    target,
    action: "delay",
    detail: `${exp.intensity}ms 지연 주입`,
  });
}

/** 오류 주입 — 실험 매칭 시 예외 발생. */
export async function maybeInjectError(target: string): Promise<void> {
  const exp = await pickExperiment(target, "error");
  if (!exp) return;
  await pushLog({
    id: newId("log"),
    at: new Date().toISOString(),
    target,
    action: "error",
    detail: `주입된 혼돈 오류 (${target})`,
  });
  throw new Error(`[chaos] injected error at ${target}`);
}

/** 저속 주입 — `intensity` 배수만큼 대기 (e.g. 3배 → 100ms → 300ms). */
export async function maybeInjectSlow(target: string, baseMs: number): Promise<void> {
  const exp = await pickExperiment(target, "slow");
  if (!exp) return;
  const extra = Math.floor(baseMs * Math.max(0, exp.intensity - 1));
  if (extra > 0) await new Promise((r) => setTimeout(r, extra));
  await pushLog({
    id: newId("log"),
    at: new Date().toISOString(),
    target,
    action: "slow",
    detail: `${extra}ms 추가 지연 (${exp.intensity}x)`,
  });
}
