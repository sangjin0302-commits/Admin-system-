/**
 * `traced(name, fn)` — 함수를 스팬으로 감싸는 헬퍼.
 *
 * 사용 예: `const load = traced("load-cases", async (id: string) => { ... });`
 * 플래그 꺼짐/스팬 미시작 시 그대로 실행 (성능 오버헤드 없음).
 */

import { startSpan, endSpan } from "@/lib/services/tracing-service";

export function traced<A extends unknown[], R>(
  name: string,
  fn: (...args: A) => Promise<R> | R
): (...args: A) => Promise<R> {
  return async (...args: A): Promise<R> => {
    const spanId = await startSpan(name);
    try {
      const result = await fn(...args);
      await endSpan(spanId, "ok");
      return result;
    } catch (err) {
      await endSpan(spanId, "error", { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  };
}

/** 명시적 스팬 실행 (start/end 자동, 결과 리턴). */
export async function withSpan<R>(name: string, fn: () => Promise<R> | R, parentId?: string): Promise<R> {
  const spanId = await startSpan(name, parentId);
  try {
    const result = await fn();
    await endSpan(spanId, "ok");
    return result;
  } catch (err) {
    await endSpan(spanId, "error", { error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}
