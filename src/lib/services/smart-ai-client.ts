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

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

async function defaultAnthropicInvoker(args: {
  model: string;
  prompt: string;
  system?: string;
  maxTokens?: number;
}): Promise<{ text: string; input_tokens: number; output_tokens: number }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY 미설정");
  const body: Record<string, unknown> = {
    model: args.model,
    max_tokens: args.maxTokens ?? 1024,
    messages: [{ role: "user", content: args.prompt }],
  };
  if (args.system) body.system = args.system;
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
  return {
    text,
    input_tokens: data.usage?.input_tokens ?? 0,
    output_tokens: data.usage?.output_tokens ?? 0,
  };
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
  const invoker = options.invoker ?? defaultAnthropicInvoker;

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
      return {
        text: res.text,
        model,
        inputTokens: res.input_tokens,
        outputTokens: res.output_tokens,
        reasoning: finalReasoning,
      };
    } catch (err) {
      lastErr = err;
      logger.warn(`[smart-ai] model ${model} failed`, err);
    }
  }
  throw new Error(
    `smartInvoke failed after ${attempted.join(",")}: ${(lastErr as Error)?.message ?? "unknown"}`
  );
}
