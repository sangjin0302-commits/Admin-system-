/**
 * Smart AI 클라이언트 — pickModel + fallback + 결정 로깅.
 *
 * 사용:
 *   const res = await smartInvoke("drafting", "긴 프롬프트...", { keywords: ["판례"] });
 *   res.text // string
 *
 * 실제 API 호출 어댑터를 주입 가능 (invoker). 기본은 Anthropic messages.
 * feature flag `smart_model_routing` 이 꺼져있으면 fallback: 항상 Sonnet.
 */

import { createHash } from "crypto";

import { cacheGet, cacheSet } from "@/lib/services/cache-service";
import { callAnthropicMessages } from "@/lib/services/anthropic-gateway";
import {
  estimateCostUsd,
  recordMetric,
} from "@/lib/services/ai-metrics-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  ComplexitySignals,
  HAIKU,
  OPUS,
  SONNET,
  TaskType,
  pickModel,
  recordDecision,
} from "@/lib/services/model-router-service";
import { logger } from "@/lib/utils/logger";

export type InvokeResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  reasoning: string;
};

export type Invoker = (args: {
  model: string;
  prompt: string;
  system?: string;
  maxTokens?: number;
}) => Promise<{ text: string; input_tokens: number; output_tokens: number }>;

const AI_CACHE_TTL = 3600; // 1 hour

// 기본 invoker 는 단일 게이트웨이를 경유 → 예산 킬스위치 + 지출 집계가 자동 적용된다.
// (라우팅/폴백/메트릭 로직은 smartInvoke 가 담당하므로 invoker 는 호출만.)
async function defaultAnthropicInvoker(args: {
  model: string;
  prompt: string;
  system?: string;
  maxTokens?: number;
}): Promise<{ text: string; input_tokens: number; output_tokens: number }> {
  const r = await callAnthropicMessages({
    model: args.model,
    prompt: args.prompt,
    system: args.system,
    maxTokens: args.maxTokens,
  });
  return { text: r.text, input_tokens: r.inputTokens, output_tokens: r.outputTokens };
}

export type SmartInvokeOptions = ComplexitySignals & {
  system?: string;
  maxTokens?: number;
  invoker?: Invoker;
};

export async function smartInvoke(
  taskType: TaskType,
  prompt: string,
  options: SmartInvokeOptions = {}
): Promise<InvokeResult> {
  const routingEnabled = await isFeatureEnabled("smart_model_routing").catch(() => true);
  const cachingEnabled = await isFeatureEnabled("ai_response_cache").catch(() => false);
  const invoker = options.invoker ?? defaultAnthropicInvoker;

  // --- cache lookup ---
  const cacheKey = `ai:${taskType}:${createHash("md5").update(prompt + (options.system || "")).digest("hex").slice(0, 16)}`;
  if (cachingEnabled) {
    const cached = cacheGet<InvokeResult>(cacheKey);
    if (cached) {
      logger.debug("[smart-ai] cache hit");
      return cached;
    }
  }

  let chosen: string;
  let reasoning: string;
  if (routingEnabled) {
    const complexity: ComplexitySignals = {
      inputLength: prompt.length,
      keywords: options.keywords,
      forceLevel: options.forceLevel,
    };
    const pick = await pickModel(taskType, complexity);
    chosen = pick.model;
    reasoning = pick.reasoning;
  } else {
    chosen = SONNET;
    reasoning = "smart_model_routing disabled → Sonnet";
  }

  const attempted: string[] = [];
  let lastErr: unknown = null;
  const tryOrder = [chosen];
  // fallback: chosen → 나머지 (cheapest 우선)
  for (const m of [HAIKU, SONNET, OPUS]) {
    if (!tryOrder.includes(m)) tryOrder.push(m);
  }

  const start = Date.now();
  for (const model of tryOrder) {
    attempted.push(model);
    try {
      const res = await invoker({
        model,
        prompt,
        system: options.system,
        maxTokens: options.maxTokens,
      });
      const costUsd = estimateCostUsd(model, res.input_tokens, res.output_tokens);
      const finalReasoning =
        model === chosen
          ? reasoning
          : `${reasoning}; fallback to ${model} after ${attempted.slice(0, -1).join(",")}`;
      await recordDecision({
        taskType,
        model,
        reasoning: finalReasoning,
        inputTokens: res.input_tokens,
        outputTokens: res.output_tokens,
        costUsd,
        success: true,
      });
      const metricsEnabled = await isFeatureEnabled("ai_metrics_tracking").catch(() => false);
      if (metricsEnabled) {
        void recordMetric({
          timestamp: new Date().toISOString(),
          function: `smart:${taskType}`,
          model,
          inputTokens: res.input_tokens,
          outputTokens: res.output_tokens,
          latencyMs: Date.now() - start,
          costUsd,
          success: true,
        }).catch((e) => logger.warn("[smart-ai] metric failed", e));
      }
      const result: InvokeResult = {
        text: res.text,
        model,
        inputTokens: res.input_tokens,
        outputTokens: res.output_tokens,
        reasoning: finalReasoning,
      };
      if (cachingEnabled) {
        cacheSet(cacheKey, result, AI_CACHE_TTL);
      }
      return result;
    } catch (err) {
      lastErr = err;
      logger.warn(`[smart-ai] model ${model} failed`, err);
    }
  }
  throw new Error(
    `smartInvoke failed after ${attempted.join(",")}: ${(lastErr as Error)?.message ?? "unknown"}`
  );
}
