/**
 * 접수 폼 퍼널 트래킹 서비스.
 *
 * 다단계 접수 폼의 단계별 완료율을 추적.
 * SiteSetting key = "intake.funnel.counters" 에 단계별 카운터 저장.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const SETTING_KEY = "intake.funnel.counters";

export type FunnelCounters = Record<string, number>;

/**
 * 퍼널 단계 기록. sessionId 기반 중복 방지 없이 단순 카운터 증가.
 */
export async function recordFunnelStep(
  sessionId: string,
  step: number,
  totalSteps: number
): Promise<void> {
  try {
    const stepKey = `step_${step}`;
    const existing = await prisma.siteSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    const counters: FunnelCounters = existing?.value
      ? (JSON.parse(existing.value as string) as FunnelCounters)
      : {};

    counters[stepKey] = (counters[stepKey] ?? 0) + 1;
    counters.totalSteps = totalSteps;

    await prisma.siteSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(counters) },
      create: { key: SETTING_KEY, value: JSON.stringify(counters) },
    });
  } catch (error) {
    logger.warn("[intake-funnel] recordFunnelStep failed", error);
  }
}

/**
 * 현재 퍼널 카운터 조회.
 */
export async function getFunnelCounters(): Promise<FunnelCounters> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: SETTING_KEY },
    });
    if (!row?.value) return {};
    return JSON.parse(row.value as string) as FunnelCounters;
  } catch {
    return {};
  }
}

/**
 * 카운터 초기화.
 */
export async function resetFunnelCounters(): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify({}) },
    create: { key: SETTING_KEY, value: JSON.stringify({}) },
  });
}
