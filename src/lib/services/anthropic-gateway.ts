/**
 * Anthropic 단일 게이트웨이.
 *
 * 배경: Anthropic Messages API 를 서비스별로 각자 fetch 하면 (1) 예산 킬스위치가
 * 적용 안 되고 (2) 월 누적 비용이 집계 안 돼 ai-budget-guard 가 헛돈다. 이 게이트웨이는
 * **모든 Anthropic 호출의 단일 통로**로서 호출 전 isAiAllowed() 를 강제하고, 호출 후
 * 추정비용을 recordAiSpend() 로 누적한다.
 *
 * 진짜 하드캡은 여전히 Anthropic 콘솔 월 한도. 이 게이트웨이는 그 전에 앱이 스스로
 * 멈추고(kill switch) 지출을 추적하는 방어층이다.
 *
 * 사용:
 *   const r = await callAnthropicMessages({ model, system, prompt, maxTokens });
 *   r.text // string, r.inputTokens/outputTokens/costUsd
 *
 * 예산 차단 시 AiBudgetBlockedError 를 던진다. 호출부는 try/catch 로 우아하게 degrade.
 */

import { estimateCostUsd } from "@/lib/services/ai-metrics-service";
import { isAiAllowed, recordAiSpend } from "@/lib/services/ai-budget-guard";
import { logger } from "@/lib/utils/logger";

export const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export class AiBudgetBlockedError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(`AI 예산 차단: ${reason}`);
    this.name = "AiBudgetBlockedError";
    this.reason = reason;
  }
}

export type AnthropicMessage = { role: "user" | "assistant"; content: string };

export type CallAnthropicArgs = {
  model: string;
  /** 단일 user 프롬프트 지름길. messages 와 동시 지정 시 messages 우선. */
  prompt?: string;
  messages?: AnthropicMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  /** Anthropic 응답 raw JSON 이 추가로 필요하면 true. */
  wantRaw?: boolean;
  /** 예산 가드 우회(테스트/헬스체크 전용). 운영 호출은 지정 금지. */
  skipBudgetGuard?: boolean;
};

export type CallAnthropicResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  raw?: unknown;
};

/**
 * 모든 Anthropic 호출의 단일 통로. 예산 가드 강제 + 지출 집계.
 * @throws AiBudgetBlockedError 예산/킬스위치로 차단된 경우
 * @throws Error API 키 미설정 또는 Anthropic 오류
 */
export async function callAnthropicMessages(args: CallAnthropicArgs): Promise<CallAnthropicResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 미설정");

  if (!args.skipBudgetGuard) {
    const decision = await isAiAllowed();
    if (!decision.ok) {
      logger.warn(`[anthropic-gateway] blocked: ${decision.reason}`);
      throw new AiBudgetBlockedError(decision.reason ?? "unknown");
    }
  }

  const messages: AnthropicMessage[] =
    args.messages && args.messages.length > 0
      ? args.messages
      : [{ role: "user", content: args.prompt ?? "" }];

  const body: Record<string, unknown> = {
    model: args.model,
    max_tokens: args.maxTokens ?? 1024,
    messages,
  };
  if (args.system) body.system = args.system;
  if (typeof args.temperature === "number") body.temperature = args.temperature;

  const res = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`anthropic ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  const costUsd = estimateCostUsd(args.model, inputTokens, outputTokens);

  // 지출 누적(best-effort) — 예산 브레이커가 다음 호출부터 실효.
  void recordAiSpend(costUsd);

  return {
    text,
    model: args.model,
    inputTokens,
    outputTokens,
    costUsd,
    raw: args.wantRaw ? data : undefined,
  };
}
