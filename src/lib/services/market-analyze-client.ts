import { logger } from "@/lib/utils/logger";

type FetchOptions = {
  method?: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  requireAuth?: boolean;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;

export async function marketAnalyzeFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const baseUrl = process.env.MARKET_BOT_API_URL;
  if (!baseUrl) {
    throw new Error("Market Analyze API 미설정");
  }

  const url = new URL(path.startsWith("/") ? path.slice(1) : path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.requireAuth) {
    const token = process.env.MARKET_BOT_ADMIN_TOKEN ?? process.env.ADMIN_API_TOKEN;
    if (!token) throw new Error("MARKET_BOT_ADMIN_TOKEN 또는 ADMIN_API_TOKEN 미설정");
    headers["x-admin-token"] = token;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const message = `Market Analyze API ${res.status} ${res.statusText} (${path})`;
      logger.error(message, { data } as Record<string, unknown>);
      throw new Error(message);
    }
    return data as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logger.error("Market Analyze API timeout", { path } as Record<string, unknown>);
      throw new Error(`Market Analyze API 응답 시간 초과 (${path})`);
    }
    if (err instanceof Error && err.message.startsWith("Market Analyze API")) throw err;
    logger.error("Market Analyze API fetch failed", { path, err: String(err) } as Record<string, unknown>);
    throw new Error(`Market Analyze API 요청 실패: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timer);
  }
}

// Typed helpers
export async function getDashboardSummary(days?: number): Promise<any> {
  return marketAnalyzeFetch("/api/dashboard/summary", { query: { days } });
}
export async function getDashboardAggregates(weeks?: number): Promise<any> {
  return marketAnalyzeFetch("/api/dashboard/aggregates", { query: { weeks } });
}
export async function getRisingTrends(): Promise<any[]> {
  const data = await marketAnalyzeFetch<any>("/api/trends/rising");
  return Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
}
export async function getCompetitors(): Promise<any[]> {
  const data = await marketAnalyzeFetch<any>("/api/competitors");
  return Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
}
export async function getCompetitorDetail(key: string): Promise<any> {
  return marketAnalyzeFetch(`/api/competitors/${encodeURIComponent(key)}`);
}
export async function getSentimentOverview(): Promise<any> {
  return marketAnalyzeFetch("/api/sentiment/overview");
}
export async function getHotTopics(): Promise<any[]> {
  const data = await marketAnalyzeFetch<any>("/api/topics/hot");
  return Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
}
export async function getHotIssues(): Promise<any[]> {
  const data = await marketAnalyzeFetch<any>("/api/hot-issues");
  return Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
}
export async function getDailyBrief(edition?: string, date?: string): Promise<any> {
  return marketAnalyzeFetch("/api/reports/daily-brief", { query: { edition, date } });
}
export async function getContentBrief(edition?: string, date?: string): Promise<any> {
  return marketAnalyzeFetch("/api/reports/content-brief", { query: { edition, date } });
}
export async function getMonthlyStrategy(): Promise<any> {
  return marketAnalyzeFetch("/api/reports/monthly-strategy");
}
export async function getWeeklyStrategy(): Promise<any> {
  return marketAnalyzeFetch("/api/reports/weekly-strategy");
}
export async function getApiHealth(): Promise<{ status: string }> {
  return marketAnalyzeFetch("/health");
}
export async function triggerNaverCollect(scope: "general" | "market" | "trends"): Promise<any> {
  const path =
    scope === "general"
      ? "/api/admin/collect/naver"
      : scope === "market"
        ? "/api/admin/collect/naver-market"
        : "/api/admin/collect/naver-trends";
  return marketAnalyzeFetch(path, { method: "POST", requireAuth: true });
}
export async function triggerFullSync(): Promise<any> {
  return marketAnalyzeFetch("/api/admin/run-full-sync", { method: "POST", requireAuth: true });
}
export async function triggerReindex(): Promise<any> {
  return marketAnalyzeFetch("/api/admin/reindex", { method: "POST", requireAuth: true });
}
export async function triggerSyncNotion(): Promise<any> {
  return marketAnalyzeFetch("/api/admin/sync-notion", { method: "POST", requireAuth: true });
}
export async function getReviewItems(status?: string, limit?: number): Promise<any[]> {
  const data = await marketAnalyzeFetch<any>("/api/review-items", {
    query: { status, limit },
    requireAuth: true,
  });
  return Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
}
export async function getDataHealth(): Promise<any> {
  return marketAnalyzeFetch("/api/data-health", { requireAuth: true });
}
export async function getMetricsReports(): Promise<any> {
  return marketAnalyzeFetch("/api/metrics/reports");
}
