/**
 * 카나리 배포 서비스 — 기능 플래그를 사용자 비율 기반으로 단계적 노출.
 *
 * 저장: SiteSetting `canary.configs` = CanaryConfig[]
 * 배정: hash(userIdOrIp + flagKey) % 100 < targetPercent
 */

import { prisma } from "@/lib/prisma/client";

const STORAGE_KEY = "canary.configs";

export type CanaryConfig = {
  flagKey: string;
  targetPercent: number; // 0..100
  currentPercent: number;
  startedAt: string;
  updatedAt: string;
  autoAdvance: boolean;
  paused?: boolean;
};

async function readConfigs(): Promise<CanaryConfig[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STORAGE_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as CanaryConfig[]) : [];
  } catch {
    return [];
  }
}

async function writeConfigs(list: CanaryConfig[]): Promise<void> {
  const value = JSON.stringify(list);
  await prisma.siteSetting.upsert({
    where: { key: STORAGE_KEY },
    create: { key: STORAGE_KEY, value },
    update: { value },
  });
}

/** 안정적 32-bit FNV-1a 해시. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export async function listCanaryConfigs(): Promise<CanaryConfig[]> {
  return readConfigs();
}

export async function getCanaryConfig(flagKey: string): Promise<CanaryConfig | null> {
  const list = await readConfigs();
  return list.find((c) => c.flagKey === flagKey) ?? null;
}

export async function upsertCanaryConfig(
  cfg: Omit<CanaryConfig, "startedAt" | "updatedAt"> & {
    startedAt?: string;
    updatedAt?: string;
  }
): Promise<CanaryConfig> {
  const list = await readConfigs();
  const now = new Date().toISOString();
  const idx = list.findIndex((c) => c.flagKey === cfg.flagKey);
  const next: CanaryConfig = {
    flagKey: cfg.flagKey,
    targetPercent: Math.max(0, Math.min(100, cfg.targetPercent)),
    currentPercent: Math.max(0, Math.min(100, cfg.currentPercent)),
    startedAt: idx >= 0 ? list[idx].startedAt : cfg.startedAt ?? now,
    updatedAt: now,
    autoAdvance: !!cfg.autoAdvance,
    paused: cfg.paused,
  };
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  await writeConfigs(list);
  return next;
}

export async function advanceCanary(flagKey: string, newPercent: number): Promise<CanaryConfig | null> {
  const cfg = await getCanaryConfig(flagKey);
  if (!cfg) return null;
  return upsertCanaryConfig({
    ...cfg,
    currentPercent: Math.max(0, Math.min(100, newPercent)),
    paused: false,
  });
}

export async function pauseCanary(flagKey: string): Promise<CanaryConfig | null> {
  const cfg = await getCanaryConfig(flagKey);
  if (!cfg) return null;
  return upsertCanaryConfig({ ...cfg, paused: true });
}

export async function removeCanaryConfig(flagKey: string): Promise<void> {
  const list = await readConfigs();
  await writeConfigs(list.filter((c) => c.flagKey !== flagKey));
}

/** 이 사용자가 카나리에 포함되는지 판정. cfg 없거나 pause 시 false. */
export function isUserInCanary(cfg: CanaryConfig | null, userIdOrIp: string): boolean {
  if (!cfg || cfg.paused) return false;
  const bucket = fnv1a(`${userIdOrIp}:${cfg.flagKey}`) % 100;
  return bucket < cfg.currentPercent;
}

/**
 * 기능 플래그 체크에 카나리를 옵트인 적용하는 헬퍼.
 * - 카나리 설정이 있으면 카나리 배정 결과를 리턴.
 * - 없으면 fallbackEnabled 값을 그대로 리턴.
 * feature-flags-service 본체는 건드리지 않음(호출측에서 이 함수를 사용).
 */
export async function checkFlagWithCanary(
  flagKey: string,
  userIdOrIp: string,
  fallbackEnabled: boolean
): Promise<boolean> {
  const cfg = await getCanaryConfig(flagKey);
  if (!cfg) return fallbackEnabled;
  return isUserInCanary(cfg, userIdOrIp);
}
