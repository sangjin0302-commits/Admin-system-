/**
 * 파인튜닝 데이터셋 자동 축적.
 *
 * - 관리자가 AI 초안(auto-reply/drafting/consultation-script)을 승인하면
 *   `recordApprovedResponse` 로 { input, output, context, approvedBy, timestamp } 를 기록.
 * - SiteSetting key `finetune.dataset` 에 최근 5000건 (JSON 배열, 페이지네이션은 조회시).
 * - Export: OpenAI JSONL, Anthropic prompt/completion 쌍.
 *
 * 통합: 승인 엔드포인트가 이 함수를 best-effort 로 호출 (실패는 무시).
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const STORE_KEY = "finetune.dataset";
const MAX_KEEP = 5000;

export type FinetuneService =
  | "auto-reply"
  | "drafting"
  | "consultation-script"
  | "other";

export type FinetuneEntry = {
  id: string;
  service: FinetuneService;
  model?: string;
  category?: string;
  input: string;
  output: string;
  context?: string;
  approvedBy?: string;
  quality?: "good" | "excellent" | "average";
  timestamp: string;
};

function newId(): string {
  return `ft_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readStore(): Promise<FinetuneEntry[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STORE_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as FinetuneEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeStore(items: FinetuneEntry[]): Promise<void> {
  const trimmed = items.slice(-MAX_KEEP);
  const value = JSON.stringify(trimmed);
  await prisma.siteSetting.upsert({
    where: { key: STORE_KEY },
    create: { key: STORE_KEY, value },
    update: { value },
  });
}

/**
 * 승인된 AI 응답을 데이터셋에 기록. best-effort — 실패해도 승인 흐름을 막지 않습니다.
 */
export async function recordApprovedResponse(
  entry: Omit<FinetuneEntry, "id" | "timestamp">
): Promise<void> {
  try {
    const enabled = await isFeatureEnabled("finetune_dataset");
    if (!enabled) return;
    const items = await readStore();
    items.push({
      ...entry,
      id: newId(),
      timestamp: new Date().toISOString(),
    });
    await writeStore(items);
  } catch (err) {
    logger.warn("[finetune-dataset] record failed", err);
  }
}

/** 페이지네이션된 조회 (최신순). */
export async function listEntries(opts?: {
  service?: FinetuneService;
  limit?: number;
  offset?: number;
}): Promise<{ items: FinetuneEntry[]; total: number }> {
  const all = await readStore();
  const filtered = opts?.service
    ? all.filter((e) => e.service === opts.service)
    : all;
  const sorted = filtered.slice().reverse();
  const limit = Math.max(1, Math.min(500, opts?.limit ?? 50));
  const offset = Math.max(0, opts?.offset ?? 0);
  return { items: sorted.slice(offset, offset + limit), total: filtered.length };
}

export type DatasetStats = {
  total: number;
  byService: Record<string, number>;
  byModel: Record<string, number>;
  byCategory: Record<string, number>;
  byQuality: Record<string, number>;
  oldest?: string;
  newest?: string;
};

export async function getStats(): Promise<DatasetStats> {
  const all = await readStore();
  const byService: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byQuality: Record<string, number> = {};
  for (const e of all) {
    byService[e.service] = (byService[e.service] ?? 0) + 1;
    if (e.model) byModel[e.model] = (byModel[e.model] ?? 0) + 1;
    if (e.category) byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
    if (e.quality) byQuality[e.quality] = (byQuality[e.quality] ?? 0) + 1;
  }
  return {
    total: all.length,
    byService,
    byModel,
    byCategory,
    byQuality,
    oldest: all[0]?.timestamp,
    newest: all[all.length - 1]?.timestamp,
  };
}

/** OpenAI 파인튜닝 JSONL (chat.completions 형식). */
export async function exportJsonl(service?: FinetuneService): Promise<string> {
  const all = await readStore();
  const filtered = service ? all.filter((e) => e.service === service) : all;
  return filtered
    .map((e) => {
      const messages = [
        ...(e.context ? [{ role: "system", content: e.context }] : []),
        { role: "user", content: e.input },
        { role: "assistant", content: e.output },
      ];
      return JSON.stringify({ messages });
    })
    .join("\n");
}

/** Anthropic prompt/completion 쌍 배열. */
export async function exportAnthropicFormat(
  service?: FinetuneService
): Promise<string> {
  const all = await readStore();
  const filtered = service ? all.filter((e) => e.service === service) : all;
  const pairs = filtered.map((e) => ({
    prompt: e.context ? `${e.context}\n\nHuman: ${e.input}\n\nAssistant:` : `Human: ${e.input}\n\nAssistant:`,
    completion: ` ${e.output}`,
    metadata: {
      service: e.service,
      model: e.model,
      category: e.category,
      approvedBy: e.approvedBy,
      timestamp: e.timestamp,
    },
  }));
  return JSON.stringify(pairs, null, 2);
}

/** 무작위 미리보기 N건. */
export async function previewRandom(n = 5): Promise<FinetuneEntry[]> {
  const all = await readStore();
  if (all.length === 0) return [];
  const picks: FinetuneEntry[] = [];
  const used = new Set<number>();
  const count = Math.min(n, all.length);
  while (picks.length < count) {
    const i = Math.floor(Math.random() * all.length);
    if (used.has(i)) continue;
    used.add(i);
    picks.push(all[i]);
  }
  return picks;
}
