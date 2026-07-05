/**
 * 자동 롤백 서비스 — 오류율 급증 감지 시 최근 활성화된 플래그·카나리 자동 되돌림.
 *
 * 데이터:
 *  - SiteSetting `errors.recent` : 5분 버킷 오류 카운트 (최근 72버킷 = 6시간)
 *  - SiteSetting `rollback.events` : 트리거 이력 (최근 100)
 *  - SiteSetting `rollback.config` : 임계값 설정
 *  - SiteSetting `feature.flags.changelog` : 최근 활성화된 플래그 기록
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { setFeatureEnabled } from "@/lib/services/feature-flags-service";
import { listCanaryConfigs, advanceCanary } from "@/lib/services/canary-rollout-service";

const ERRORS_KEY = "errors.recent";
const EVENTS_KEY = "rollback.events";
const CONFIG_KEY = "rollback.config";
const CHANGELOG_KEY = "feature.flags.changelog";

const BUCKET_MS = 5 * 60 * 1000;
const MAX_BUCKETS = 72; // 6h
const MAX_EVENTS = 100;
const MAX_CHANGELOG = 200;

export type ErrorBucket = { bucketStart: number; count: number };
export type RollbackConfig = {
  errorSpikeMultiplier: number; // baseline * n → trigger
  baselineLookbackBuckets: number;
  minAbsoluteCount: number; // baseline 이 낮을 때 노이즈 방지
};
export type RollbackEvent = {
  id: string;
  triggeredAt: string;
  reason: string;
  currentRate: number;
  baselineRate: number;
  actions: string[];
};
export type FlagChangelogEntry = {
  key: string;
  enabled: boolean;
  changedAt: string;
};

const DEFAULT_CONFIG: RollbackConfig = {
  errorSpikeMultiplier: 3,
  baselineLookbackBuckets: 12, // 1시간
  minAbsoluteCount: 5,
};

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

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 외부에서 오류 발생 시 호출 — 5분 버킷에 증분. */
export async function recordError(count = 1): Promise<void> {
  const list = await readJson<ErrorBucket[]>(ERRORS_KEY, []);
  const bucketStart = Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS;
  const last = list[list.length - 1];
  if (last && last.bucketStart === bucketStart) last.count += count;
  else list.push({ bucketStart, count });
  const trimmed = list.slice(-MAX_BUCKETS);
  await writeJson(ERRORS_KEY, trimmed);
}

export async function getErrorBuckets(): Promise<ErrorBucket[]> {
  return readJson<ErrorBucket[]>(ERRORS_KEY, []);
}

export async function getRollbackConfig(): Promise<RollbackConfig> {
  const cfg = await readJson<Partial<RollbackConfig>>(CONFIG_KEY, {});
  return { ...DEFAULT_CONFIG, ...cfg };
}

export async function setRollbackConfig(cfg: Partial<RollbackConfig>): Promise<RollbackConfig> {
  const next = { ...(await getRollbackConfig()), ...cfg };
  await writeJson(CONFIG_KEY, next);
  return next;
}

export async function getRollbackEvents(): Promise<RollbackEvent[]> {
  return readJson<RollbackEvent[]>(EVENTS_KEY, []);
}

async function pushEvent(event: RollbackEvent): Promise<void> {
  const list = await getRollbackEvents();
  list.push(event);
  await writeJson(EVENTS_KEY, list.slice(-MAX_EVENTS));
}

/** 플래그 켠 이력 기록 (호출은 관리자 UI 저장 hook 에서). */
export async function recordFlagChange(key: string, enabled: boolean): Promise<void> {
  const list = await readJson<FlagChangelogEntry[]>(CHANGELOG_KEY, []);
  list.push({ key, enabled, changedAt: new Date().toISOString() });
  await writeJson(CHANGELOG_KEY, list.slice(-MAX_CHANGELOG));
}

export async function getFlagChangelog(): Promise<FlagChangelogEntry[]> {
  return readJson<FlagChangelogEntry[]>(CHANGELOG_KEY, []);
}

/** 최근 활성화된 플래그(24시간 내) 목록. */
async function recentlyEnabledFlags(withinMs = 24 * 60 * 60 * 1000): Promise<string[]> {
  const cutoff = Date.now() - withinMs;
  const changelog = await getFlagChangelog();
  const enabledMap = new Map<string, boolean>();
  for (const entry of changelog) {
    if (new Date(entry.changedAt).getTime() < cutoff) continue;
    enabledMap.set(entry.key, entry.enabled);
  }
  return Array.from(enabledMap.entries())
    .filter(([, enabled]) => enabled)
    .map(([k]) => k);
}

export type RollbackCheckResult = {
  triggered: boolean;
  reason?: string;
  actions: string[];
  currentRate: number;
  baselineRate: number;
};

export async function checkAndMaybeRollback(): Promise<RollbackCheckResult> {
  const cfg = await getRollbackConfig();
  const buckets = await getErrorBuckets();
  if (buckets.length < 2) {
    return { triggered: false, actions: [], currentRate: 0, baselineRate: 0 };
  }
  const current = buckets[buckets.length - 1];
  const baselineSlice = buckets.slice(-1 - cfg.baselineLookbackBuckets, -1);
  const baselineRate = baselineSlice.length
    ? baselineSlice.reduce((s, b) => s + b.count, 0) / baselineSlice.length
    : 0;
  const currentRate = current.count;
  const threshold = Math.max(cfg.minAbsoluteCount, baselineRate * cfg.errorSpikeMultiplier);
  if (currentRate < threshold) {
    return { triggered: false, actions: [], currentRate, baselineRate };
  }

  const actions: string[] = [];
  try {
    const flags = await recentlyEnabledFlags();
    for (const key of flags) {
      try {
        await setFeatureEnabled(key, false);
        actions.push(`플래그 비활성화: ${key}`);
      } catch (err) {
        logger.warn("[auto-rollback] 플래그 비활성화 실패", { key, err: String(err) });
      }
    }
    const canaries = await listCanaryConfigs();
    for (const c of canaries) {
      if (c.currentPercent > 0 && !c.paused) {
        await advanceCanary(c.flagKey, 0);
        actions.push(`카나리 0% 롤백: ${c.flagKey}`);
      }
    }
  } catch (err) {
    logger.error("[auto-rollback] 액션 수행 실패", { err: String(err) });
  }

  const event: RollbackEvent = {
    id: newId("rb"),
    triggeredAt: new Date().toISOString(),
    reason: `오류율 급증 (현재 ${currentRate} / 기준선 ${baselineRate.toFixed(1)})`,
    currentRate,
    baselineRate,
    actions,
  };
  await pushEvent(event);
  logger.warn("[auto-rollback] 롤백 트리거", { event });
  return { triggered: true, reason: event.reason, actions, currentRate, baselineRate };
}

/** 관리자 UI 에서 수동 롤백. */
export async function manualRollback(reason: string): Promise<RollbackEvent> {
  const actions: string[] = [];
  const flags = await recentlyEnabledFlags();
  for (const key of flags) {
    try {
      await setFeatureEnabled(key, false);
      actions.push(`플래그 비활성화: ${key}`);
    } catch {
      /* ignore */
    }
  }
  const canaries = await listCanaryConfigs();
  for (const c of canaries) {
    if (c.currentPercent > 0 && !c.paused) {
      await advanceCanary(c.flagKey, 0);
      actions.push(`카나리 0% 롤백: ${c.flagKey}`);
    }
  }
  const event: RollbackEvent = {
    id: newId("rb"),
    triggeredAt: new Date().toISOString(),
    reason: `수동 롤백: ${reason}`,
    currentRate: 0,
    baselineRate: 0,
    actions,
  };
  await pushEvent(event);
  return event;
}
