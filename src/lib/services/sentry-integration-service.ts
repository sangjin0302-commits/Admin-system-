/**
 * Sentry 통합 — 미치유 에러/워닝을 Sentry로 배치 전송하고, 자가 치유 성공 시 해결 마킹.
 *
 * error-monitor-service 는 이미 개별 이벤트마다 즉시 Sentry에 store API를 호출하지만,
 * 본 서비스는 아래를 추가한다:
 *   - 배치 큐 (최대 100개, 30초 flush) — 자체 서버측 이벤트/치유 결과 발송
 *   - Sentry 이벤트 resolve API 래퍼 (SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN 필요)
 *   - self-healing-service 후속에서 호출: onHeal 시 관련 이벤트를 resolved 마킹
 *
 * feature flag: sentry_monitoring (default false — 설정 필요)
 */

import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export type SentryOutboundEvent = {
  id: string;
  level: "error" | "warning" | "info";
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  fingerprint?: string[];
};

export type SentryConfig = {
  dsn: string | null;
  org: string | null;
  project: string | null;
  authToken: string | null;
  environment: string;
};

export type SentrySendResult = {
  sent: number;
  failed: number;
  skipped: boolean;
  reason?: string;
};

const MAX_BATCH = 100;
const FLUSH_INTERVAL_MS = 30_000;

declare global {
  // eslint-disable-next-line no-var
  var __sentryOutboundQueue: SentryOutboundEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __sentryFlushTimer: ReturnType<typeof setInterval> | null | undefined;
}

function queue(): SentryOutboundEvent[] {
  if (!globalThis.__sentryOutboundQueue) {
    globalThis.__sentryOutboundQueue = [];
  }
  return globalThis.__sentryOutboundQueue;
}

export function getSentryConfig(): SentryConfig {
  return {
    dsn: process.env.SENTRY_DSN ?? null,
    org: process.env.SENTRY_ORG ?? null,
    project: process.env.SENTRY_PROJECT ?? null,
    authToken: process.env.SENTRY_AUTH_TOKEN ?? null,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
  };
}

export function isSentryConfigured(): boolean {
  const cfg = getSentryConfig();
  return Boolean(cfg.dsn);
}

type ParsedDsn = {
  storeUrl: string;
  publicKey: string;
  projectId: string;
  host: string;
};

function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const u = new URL(dsn);
    const publicKey = u.username;
    const projectId = u.pathname.replace(/^\//, "").split("/").pop() ?? "";
    if (!publicKey || !projectId) return null;
    return {
      publicKey,
      projectId,
      host: u.host,
      storeUrl: `${u.protocol}//${u.host}/api/${projectId}/store/`,
    };
  } catch {
    return null;
  }
}

/**
 * 배치 큐에 이벤트 추가. 큐가 MAX_BATCH 초과하면 오래된 항목 drop.
 */
export function enqueueSentryEvent(event: SentryOutboundEvent): void {
  const q = queue();
  q.push(event);
  while (q.length > MAX_BATCH) {
    q.shift();
  }
}

/**
 * 큐를 즉시 flush 하고 Sentry store API로 전송.
 * feature flag OFF 또는 DSN 미설정 시 skip.
 */
export async function flushSentryBatch(): Promise<SentrySendResult> {
  const enabled = await isFeatureEnabled("sentry_monitoring");
  if (!enabled) {
    return { sent: 0, failed: 0, skipped: true, reason: "feature_disabled" };
  }
  const cfg = getSentryConfig();
  if (!cfg.dsn) {
    return { sent: 0, failed: 0, skipped: true, reason: "no_dsn" };
  }
  const parsed = parseDsn(cfg.dsn);
  if (!parsed) {
    return { sent: 0, failed: 0, skipped: true, reason: "invalid_dsn" };
  }

  const q = queue();
  if (q.length === 0) {
    return { sent: 0, failed: 0, skipped: false };
  }
  const batch = q.splice(0, MAX_BATCH);

  let sent = 0;
  let failed = 0;

  for (const event of batch) {
    const payload = {
      event_id: event.id.replace(/-/g, "").slice(0, 32),
      timestamp: event.timestamp,
      level: event.level,
      platform: "node",
      environment: cfg.environment,
      logger: "admin-office",
      message: { formatted: event.message },
      extra: event.context ?? {},
      fingerprint: event.fingerprint,
    };
    try {
      const res = await fetch(parsed.storeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=admin-office/1.0, sentry_key=${parsed.publicKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) sent++;
      else failed++;
    } catch (err) {
      failed++;
      logger.warn("[sentry-integration] send failed", err);
    }
  }

  return { sent, failed, skipped: false };
}

/**
 * 정기 flush 타이머 등록 (동일 프로세스에서 한 번만).
 * Next.js API 라우트/서버리스에서는 요청 마지막에 flush 하는 편이 안정적.
 */
export function ensureBackgroundFlush(): void {
  if (globalThis.__sentryFlushTimer) return;
  globalThis.__sentryFlushTimer = setInterval(() => {
    void flushSentryBatch().catch((err) =>
      logger.warn("[sentry-integration] background flush failed", err)
    );
  }, FLUSH_INTERVAL_MS);
}

export function stopBackgroundFlush(): void {
  const t = globalThis.__sentryFlushTimer;
  if (t) clearInterval(t);
  globalThis.__sentryFlushTimer = null;
}

/**
 * self-healing-service에서 자가 치유 성공 시 호출. Sentry issue resolve.
 * 필요 환경: SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN.
 * 성공 시 true, 설정 부족/실패 시 false 반환 (best-effort).
 */
export async function markSentryEventResolved(eventId: string): Promise<boolean> {
  const enabled = await isFeatureEnabled("sentry_monitoring");
  if (!enabled) return false;
  const cfg = getSentryConfig();
  if (!cfg.org || !cfg.project || !cfg.authToken) return false;

  try {
    const url = `https://sentry.io/api/0/projects/${cfg.org}/${cfg.project}/events/${encodeURIComponent(
      eventId
    )}/`;
    // Sentry는 event 자체 resolve 대신 issue 를 resolve 하므로 우선 event 조회 → issue id → 업데이트
    const evRes = await fetch(url, {
      headers: { Authorization: `Bearer ${cfg.authToken}` },
    });
    if (!evRes.ok) return false;
    const evJson = (await evRes.json()) as { groupID?: string };
    const issueId = evJson.groupID;
    if (!issueId) return false;
    const resolveRes = await fetch(`https://sentry.io/api/0/issues/${issueId}/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cfg.authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "resolved" }),
    });
    return resolveRes.ok;
  } catch (err) {
    logger.warn("[sentry-integration] resolve failed", err);
    return false;
  }
}

/**
 * 테스트 이벤트 전송 — 관리자 UI "테스트" 버튼에서 사용.
 */
export async function sendTestEvent(message = "Sentry 통합 테스트 이벤트"): Promise<SentrySendResult> {
  enqueueSentryEvent({
    id: `test_${Date.now().toString(36)}`,
    level: "info",
    message,
    timestamp: new Date().toISOString(),
    context: { source: "admin_test_button" },
    fingerprint: ["sentry-integration-test"],
  });
  return flushSentryBatch();
}

/**
 * 관리자 UI용 최근 큐 요약.
 */
export function getSentryQueueSummary(): {
  queued: number;
  maxBatch: number;
  configured: boolean;
  environment: string;
} {
  const cfg = getSentryConfig();
  return {
    queued: queue().length,
    maxBatch: MAX_BATCH,
    configured: Boolean(cfg.dsn),
    environment: cfg.environment,
  };
}
