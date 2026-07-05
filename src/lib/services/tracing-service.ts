/**
 * 분산 트레이싱 서비스 (경량 OpenTelemetry 호환).
 *
 * - 스팬을 인메모리로 수집한 뒤 SiteSetting `tracing.recent`(링 버퍼, 최대 1000개)에 주기적으로 flush.
 * - 옵트인: `traced()` 헬퍼로 감싸는 함수만 수집됨.
 * - 플래그 `distributed_tracing` 이 꺼져 있으면 no-op.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const STORAGE_KEY = "tracing.recent";
const MAX_SPANS = 1000;
const FLUSH_MS = 5_000;

export type Span = {
  id: string;
  parentId?: string;
  traceId: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  status?: "ok" | "error";
  attributes: Record<string, unknown>;
};

const _live = new Map<string, Span>();
const _completed: Span[] = [];
let _lastFlush = 0;

function newId(prefix = "s"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function isEnabled(): Promise<boolean> {
  try {
    return await isFeatureEnabled("distributed_tracing");
  } catch {
    return false;
  }
}

/** 새 스팬 시작. `parentId` 지정 시 하위 스팬. 플래그 꺼지면 no-op sentinel 반환. */
export async function startSpan(
  name: string,
  parentId?: string,
  attributes: Record<string, unknown> = {}
): Promise<string> {
  if (!(await isEnabled())) return "";
  const parent = parentId ? _live.get(parentId) : undefined;
  const span: Span = {
    id: newId(),
    parentId,
    traceId: parent?.traceId ?? newId("t"),
    name,
    startedAt: Date.now(),
    attributes,
  };
  _live.set(span.id, span);
  return span.id;
}

/** 스팬 종료 → 완료 버퍼로 이동. 빈 id는 무시(no-op). */
export async function endSpan(
  spanId: string,
  status: "ok" | "error" = "ok",
  extraAttributes?: Record<string, unknown>
): Promise<void> {
  if (!spanId) return;
  const span = _live.get(spanId);
  if (!span) return;
  span.endedAt = Date.now();
  span.durationMs = span.endedAt - span.startedAt;
  span.status = status;
  if (extraAttributes) span.attributes = { ...span.attributes, ...extraAttributes };
  _live.delete(spanId);
  _completed.push(span);
  if (_completed.length > MAX_SPANS) _completed.splice(0, _completed.length - MAX_SPANS);
  if (Date.now() - _lastFlush > FLUSH_MS) {
    _lastFlush = Date.now();
    void flushToStorage();
  }
}

async function flushToStorage(): Promise<void> {
  try {
    const existing = await readStored();
    const merged = [...existing, ..._completed.splice(0)];
    const trimmed = merged.slice(-MAX_SPANS);
    await prisma.siteSetting.upsert({
      where: { key: STORAGE_KEY },
      create: { key: STORAGE_KEY, value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    });
  } catch (err) {
    logger.warn("[tracing] flush 실패", { err: String(err) });
  }
}

async function readStored(): Promise<Span[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STORAGE_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as Span[]) : [];
  } catch {
    return [];
  }
}

/** 최근 스팬 조회 (필터·정렬 포함). */
export async function getRecentTraces(
  limit = 200,
  opts?: { nameFilter?: string; minDurationMs?: number }
): Promise<Span[]> {
  await flushToStorage(); // 인메모리 미저장 스팬 동기화
  const all = await readStored();
  let filtered = all;
  if (opts?.nameFilter) {
    const q = opts.nameFilter.toLowerCase();
    filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));
  }
  if (opts?.minDurationMs && opts.minDurationMs > 0) {
    filtered = filtered.filter((s) => (s.durationMs ?? 0) >= opts.minDurationMs!);
  }
  return filtered.slice(-limit).reverse();
}

/** OTLP 호환 JSON 내보내기 (완료된 스팬만). */
export async function exportOtlp(): Promise<unknown> {
  const spans = await readStored();
  return {
    resourceSpans: [
      {
        resource: { attributes: [{ key: "service.name", value: { stringValue: "ethos-admin" } }] },
        scopeSpans: [
          {
            scope: { name: "tracing-service", version: "1.0.0" },
            spans: spans.map((s) => ({
              traceId: s.traceId,
              spanId: s.id,
              parentSpanId: s.parentId,
              name: s.name,
              startTimeUnixNano: String(s.startedAt * 1_000_000),
              endTimeUnixNano: s.endedAt ? String(s.endedAt * 1_000_000) : undefined,
              status: { code: s.status === "error" ? 2 : 1 },
              attributes: Object.entries(s.attributes).map(([key, value]) => ({
                key,
                value: { stringValue: String(value) },
              })),
            })),
          },
        ],
      },
    ],
  };
}
