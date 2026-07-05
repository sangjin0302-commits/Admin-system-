/**
 * 자동 프롬프트 최적화.
 *
 * 저장: SiteSetting `prompts.versions.{service}` = JSON 배열 (버전 목록)
 * - 각 버전: id, prompt, active, pinned, stats(사용/만족/성공)
 * - 사용자 피드백(record*)으로 통계 갱신.
 * - autoPromoteIfBetter: 만족도가 유의미하게 높으면 active 로 전환 (핀 되어있으면 무시).
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { chiSquare2x2 } from "@/lib/services/ab-auto-promote-service";

const MIN_USAGE_FOR_PROMOTION = 50;

function storeKey(service: string): string {
  return `prompts.versions.${service}`;
}

export type PromptVersion = {
  id: string;
  service: string;
  version: number;
  prompt: string;
  createdAt: string;
  createdBy?: string;
  active: boolean;
  pinned: boolean;
  stats: {
    usage: number;
    satisfied: number; // 사용자 피드백 긍정
    dissatisfied: number;
    successes: number; // 서비스 성공(승인/전환)
    failures: number;
  };
};

function newId(): string {
  return `pv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

async function readVersions(service: string): Promise<PromptVersion[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: storeKey(service) } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as PromptVersion[]) : [];
  } catch {
    return [];
  }
}

async function writeVersions(service: string, items: PromptVersion[]): Promise<void> {
  const key = storeKey(service);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(items) },
    update: { value: JSON.stringify(items) },
  });
}

/** 현재 active 버전의 프롬프트 문자열을 반환. 없으면 null (호출자는 하드코딩 폴백 사용). */
export async function getActive(service: string): Promise<string | null> {
  const versions = await readVersions(service);
  const active = versions.find((v) => v.active);
  return active?.prompt ?? null;
}

export async function getActiveVersion(service: string): Promise<PromptVersion | null> {
  const versions = await readVersions(service);
  return versions.find((v) => v.active) ?? null;
}

export async function listVersions(service: string): Promise<PromptVersion[]> {
  return readVersions(service);
}

export async function saveVersion(input: {
  service: string;
  prompt: string;
  createdBy?: string;
  activate?: boolean;
}): Promise<PromptVersion> {
  const versions = await readVersions(input.service);
  const nextVersion = versions.reduce((m, v) => Math.max(m, v.version), 0) + 1;
  const created: PromptVersion = {
    id: newId(),
    service: input.service,
    version: nextVersion,
    prompt: input.prompt,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    active: false,
    pinned: false,
    stats: { usage: 0, satisfied: 0, dissatisfied: 0, successes: 0, failures: 0 },
  };
  if (input.activate) {
    for (const v of versions) v.active = false;
    created.active = true;
  }
  versions.push(created);
  await writeVersions(input.service, versions);
  return created;
}

export async function setActive(service: string, versionId: string): Promise<void> {
  const versions = await readVersions(service);
  let found = false;
  for (const v of versions) {
    if (v.id === versionId) {
      v.active = true;
      found = true;
    } else {
      v.active = false;
    }
  }
  if (!found) throw new Error(`알 수 없는 버전 id: ${versionId}`);
  await writeVersions(service, versions);
}

export async function setPinned(
  service: string,
  versionId: string,
  pinned: boolean
): Promise<void> {
  const versions = await readVersions(service);
  const v = versions.find((x) => x.id === versionId);
  if (!v) throw new Error(`알 수 없는 버전 id: ${versionId}`);
  v.pinned = pinned;
  await writeVersions(service, versions);
}

export async function rollback(service: string): Promise<void> {
  const versions = await readVersions(service);
  const activeIdx = versions.findIndex((v) => v.active);
  if (activeIdx <= 0) return;
  for (const v of versions) v.active = false;
  versions[activeIdx - 1].active = true;
  await writeVersions(service, versions);
}

export async function recordUsage(service: string, versionId?: string): Promise<void> {
  const versions = await readVersions(service);
  const v =
    (versionId ? versions.find((x) => x.id === versionId) : versions.find((x) => x.active)) ??
    null;
  if (!v) return;
  v.stats.usage += 1;
  await writeVersions(service, versions).catch((e) =>
    logger.warn("[prompt-optimizer] recordUsage failed", e)
  );
}

export async function recordFeedback(
  service: string,
  versionId: string,
  satisfied: boolean
): Promise<void> {
  const versions = await readVersions(service);
  const v = versions.find((x) => x.id === versionId);
  if (!v) return;
  if (satisfied) v.stats.satisfied += 1;
  else v.stats.dissatisfied += 1;
  await writeVersions(service, versions).catch((e) =>
    logger.warn("[prompt-optimizer] recordFeedback failed", e)
  );
}

export async function recordOutcome(
  service: string,
  versionId: string,
  success: boolean
): Promise<void> {
  const versions = await readVersions(service);
  const v = versions.find((x) => x.id === versionId);
  if (!v) return;
  if (success) v.stats.successes += 1;
  else v.stats.failures += 1;
  await writeVersions(service, versions).catch((e) =>
    logger.warn("[prompt-optimizer] recordOutcome failed", e)
  );
}

/**
 * 만족도 기준으로 유의미하게 나은 후보가 있으면 active 전환.
 * 핀된 active 는 유지.
 */
export async function autoPromoteIfBetter(service: string): Promise<{
  promoted?: { from: string; to: string; chiSquare: number };
  reason?: string;
}> {
  const versions = await readVersions(service);
  const active = versions.find((v) => v.active);
  if (!active) return { reason: "no active version" };
  if (active.pinned) return { reason: "active is pinned" };
  const candidates = versions.filter(
    (v) => v.id !== active.id && v.stats.usage >= MIN_USAGE_FOR_PROMOTION
  );
  if (candidates.length === 0) return { reason: "no candidates with sufficient usage" };
  if (active.stats.usage < MIN_USAGE_FOR_PROMOTION) return { reason: "active has insufficient usage" };

  let best: { v: PromptVersion; chi: number } | null = null;
  for (const c of candidates) {
    const chi = chiSquare2x2(
      c.stats.satisfied,
      c.stats.satisfied + c.stats.dissatisfied,
      active.stats.satisfied,
      active.stats.satisfied + active.stats.dissatisfied
    );
    const cRate =
      (c.stats.satisfied + c.stats.dissatisfied) > 0
        ? c.stats.satisfied / (c.stats.satisfied + c.stats.dissatisfied)
        : 0;
    const aRate =
      (active.stats.satisfied + active.stats.dissatisfied) > 0
        ? active.stats.satisfied / (active.stats.satisfied + active.stats.dissatisfied)
        : 0;
    if (chi.significant && cRate > aRate) {
      if (!best || chi.statistic > best.chi) best = { v: c, chi: chi.statistic };
    }
  }
  if (!best) return { reason: "no significantly better candidate" };
  for (const v of versions) v.active = v.id === best.v.id;
  await writeVersions(service, versions);
  return { promoted: { from: active.id, to: best.v.id, chiSquare: best.chi } };
}
