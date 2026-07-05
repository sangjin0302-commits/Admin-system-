/**
 * AI API 호출 메트릭 래퍼 (opt-in).
 *
 * 사용:
 *   const result = await withMetrics(
 *     { functionName: "auto-reply", model: "claude-sonnet-4-5" },
 *     async () => {
 *       const res = await anthropic.messages.create(...);
 *       return { result: res, usage: { input_tokens: res.usage.input_tokens, output_tokens: res.usage.output_tokens } };
 *     }
 *   );
 *
 * feature flag `ai_metrics_tracking` 이 꺼져있으면 수집을 건너뜁니다 (호출은 정상 실행).
 */

import { estimateCostUsd, recordMetric } from "@/lib/services/ai-metrics-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export type WithMetricsOptions = {
  functionName: string;
  model: string;
};

export type WithMetricsCallResult<T> = {
  result: T;
  usage: { input_tokens: number; output_tokens: number };
};

/**
 * apiCall 을 실행하고, 반환된 usage 로 메트릭을 기록. 실패해도 예외는 전파.
 */
export async function withMetrics<T>(
  opts: WithMetricsOptions,
  apiCall: () => Promise<WithMetricsCallResult<T>>
): Promise<T> {
  const start = Date.now();
  let success = false;
  let input = 0;
  let output = 0;
  let result: T;
  try {
    const wrapped = await apiCall();
    input = wrapped.usage.input_tokens || 0;
    output = wrapped.usage.output_tokens || 0;
    success = true;
    result = wrapped.result;
  } catch (err) {
    // 실패 이벤트도 기록
    const enabled = await isFeatureEnabled("ai_metrics_tracking").catch(() => false);
    if (enabled) {
      void recordMetric({
        timestamp: new Date().toISOString(),
        function: opts.functionName,
        model: opts.model,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - start,
        costUsd: 0,
        success: false,
      }).catch((e) => logger.warn("[ai-metrics-wrapper] failure record failed", e));
    }
    throw err;
  }
  const enabled = await isFeatureEnabled("ai_metrics_tracking").catch(() => false);
  if (enabled) {
    void recordMetric({
      timestamp: new Date().toISOString(),
      function: opts.functionName,
      model: opts.model,
      inputTokens: input,
      outputTokens: output,
      latencyMs: Date.now() - start,
      costUsd: estimateCostUsd(opts.model, input, output),
      success,
    }).catch((e) => logger.warn("[ai-metrics-wrapper] record failed", e));
  }
  return result;
}
