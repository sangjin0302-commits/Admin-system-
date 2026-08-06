/**
 * 자가 치유 서비스 — 알려진 안전한 에러 패턴에 자동 복구 액션 적용.
 * 미지 에러는 Claude Haiku가 분석하여 관리자 검토 큐에 기록.
 *
 * 저장: SiteSetting key = "self_healing.log" (JSON)
 */

import { prisma } from "@/lib/prisma/client";
import { getRecentErrors, type ErrorEvent } from "@/lib/services/error-monitor-service";
import { markSentryEventResolved } from "@/lib/services/sentry-integration-service";
import { logger } from "@/lib/utils/logger";
import { callAnthropicMessages } from "@/lib/services/anthropic-gateway";

const LOG_KEY = "self_healing.log";
const MAX_LOG = 200;

export type HealAction =
  | "db_retry"
  | "rate_limit_backoff"
  | "ai_fallback_model"
  | "external_api_alternate"
  | "none";

export type HealRecord = {
  id: string;
  at: string;
  errorId?: string;
  errorMessage: string;
  matchedPattern: string | null;
  action: HealAction;
  healed: boolean;
  aiSuggestion?: string;
  status: "auto_healed" | "pending_review" | "ignored";
};

export type HealResult = {
  healed: boolean;
  action: HealAction;
  aiSuggestion?: string;
  record: HealRecord;
};

type Pattern = {
  name: string;
  test: (msg: string) => boolean;
  action: HealAction;
  apply: () => Promise<void>;
};

const PATTERNS: Pattern[] = [
  {
    name: "db_connection_lost",
    test: (m) => /ECONNRESET|connection.*(lost|closed|terminated)|PrismaClientInitializationError/i.test(m),
    action: "db_retry",
    apply: async () => {
      // 5초 대기 후 재시도 (호출측이 재시도 로직 사용)
      await new Promise((r) => setTimeout(r, 5000));
    },
  },
  {
    name: "rate_limit_429",
    test: (m) => /429|rate.?limit|too many requests/i.test(m),
    action: "rate_limit_backoff",
    apply: async () => {
      // 지수 백오프 힌트 저장
      await recordBackoffHint();
    },
  },
  {
    name: "ai_api_429",
    test: (m) => /(anthropic|openai|claude).*(429|overloaded|rate)/i.test(m),
    action: "ai_fallback_model",
    apply: async () => {
      await setFallbackModelHint();
    },
  },
  {
    name: "external_api_timeout",
    test: (m) => /(ETIMEDOUT|timeout|ECONNABORTED).*(fetch|axios|http)/i.test(m),
    action: "external_api_alternate",
    apply: async () => {
      // 대체 프로바이더 힌트
    },
  },
];

async function recordBackoffHint(): Promise<void> {
  await prisma.siteSetting
    .upsert({
      where: { key: "self_healing.backoff_until" },
      create: { key: "self_healing.backoff_until", value: String(Date.now() + 60_000) },
      update: { value: String(Date.now() + 60_000) },
    })
    .catch(() => null);
}

async function setFallbackModelHint(): Promise<void> {
  await prisma.siteSetting
    .upsert({
      where: { key: "self_healing.ai_fallback_active" },
      create: { key: "self_healing.ai_fallback_active", value: String(Date.now() + 300_000) },
      update: { value: String(Date.now() + 300_000) },
    })
    .catch(() => null);
}

function genId(): string {
  return `heal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function loadLog(): Promise<HealRecord[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: LOG_KEY } }).catch(() => null);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value) as HealRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveLog(log: HealRecord[]): Promise<void> {
  const trimmed = log.slice(-MAX_LOG);
  await prisma.siteSetting
    .upsert({
      where: { key: LOG_KEY },
      create: { key: LOG_KEY, value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    })
    .catch(() => null);
}

async function appendRecord(rec: HealRecord): Promise<void> {
  const log = await loadLog();
  log.push(rec);
  await saveLog(log);
}

/** Claude Haiku로 미지 에러 분석 (짧은 원인/해결 제안). */
async function aiSuggestFix(err: { message: string; stack?: string }): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return "AI 분석 불가 (ANTHROPIC_API_KEY 미설정)";
  try {
    const r = await callAnthropicMessages({
      model: "claude-haiku-4-5",
      maxTokens: 300,
      prompt: `다음 에러의 원인과 안전한 복구 방안을 3줄 이내 한국어로 제안:\n\n메시지: ${err.message}\n스택: ${(err.stack ?? "").slice(0, 800)}`,
    });
    return r.text.trim() || "제안 없음";
  } catch (e) {
    // 게이트웨이는 HTTP 오류도 throw 하므로 상태코드를 복원해 기존 메시지 분기를 보존.
    const msg = e instanceof Error ? e.message : String(e);
    const statusMatch = msg.match(/anthropic (\d{3})/);
    if (statusMatch) return `AI 분석 실패 (${statusMatch[1]})`;
    return `AI 분석 예외: ${msg}`;
  }
}

export async function analyzeAndHeal(
  error: { id?: string; message: string; stack?: string },
  _context?: Record<string, unknown>
): Promise<HealResult> {
  const matched = PATTERNS.find((p) => p.test(error.message));
  if (matched) {
    try {
      await matched.apply();
    } catch (e) {
      logger.debug("[self-heal] apply failed", { err: e instanceof Error ? e.message : String(e) });
    }
    const record: HealRecord = {
      id: genId(),
      at: new Date().toISOString(),
      errorId: error.id,
      errorMessage: error.message.slice(0, 300),
      matchedPattern: matched.name,
      action: matched.action,
      healed: true,
      status: "auto_healed",
    };
    await appendRecord(record);
    // Sentry 연동: 치유 성공 시 관련 이벤트를 resolved 로 마킹 (best-effort)
    if (error.id) {
      void markSentryEventResolved(error.id).catch(() => undefined);
    }
    return { healed: true, action: matched.action, record };
  }

  const suggestion = await aiSuggestFix(error);
  const record: HealRecord = {
    id: genId(),
    at: new Date().toISOString(),
    errorId: error.id,
    errorMessage: error.message.slice(0, 300),
    matchedPattern: null,
    action: "none",
    healed: false,
    aiSuggestion: suggestion,
    status: "pending_review",
  };
  await appendRecord(record);
  return { healed: false, action: "none", aiSuggestion: suggestion, record };
}

/** 최근 에러 스캔 후 자동 치유 실행 (크론용). */
export async function scanAndHeal(): Promise<{
  scanned: number;
  healed: number;
  pending: number;
}> {
  const errors: ErrorEvent[] = getRecentErrors(50, "error");
  let healed = 0;
  let pending = 0;
  for (const e of errors) {
    if (e.resolved) continue;
    const r = await analyzeAndHeal({ id: e.id, message: e.message, stack: e.stack });
    if (r.healed) healed++;
    else pending++;
  }
  return { scanned: errors.length, healed, pending };
}

export async function getHealLog(): Promise<HealRecord[]> {
  return loadLog();
}

export async function updateRecordStatus(
  id: string,
  status: HealRecord["status"]
): Promise<boolean> {
  const log = await loadLog();
  const idx = log.findIndex((r) => r.id === id);
  if (idx < 0) return false;
  log[idx] = { ...log[idx], status };
  await saveLog(log);
  return true;
}

export async function getHealStats(): Promise<{
  total: number;
  autoHealed: number;
  pending: number;
  successRate: number;
}> {
  const log = await loadLog();
  const auto = log.filter((r) => r.status === "auto_healed").length;
  const pending = log.filter((r) => r.status === "pending_review").length;
  const total = log.length;
  return {
    total,
    autoHealed: auto,
    pending,
    successRate: total > 0 ? Math.round((auto / total) * 100) : 0,
  };
}
