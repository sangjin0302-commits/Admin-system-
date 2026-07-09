import { logger } from "@/lib/utils/logger";

type GscQueryRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type GscResponse = {
  rows?: GscQueryRow[];
};

export type GscTopQuery = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export async function getTopSearchQueries(days = 28, limit = 20): Promise<GscTopQuery[]> {
  return getSearchQueriesRange(days, 0, limit);
}

/** startDaysAgo ~ endDaysAgo 구간의 검색 쿼리 (DDD2 순위 비교용). */
export async function getSearchQueriesRange(startDaysAgo: number, endDaysAgo: number, limit = 20): Promise<GscTopQuery[]> {
  const accessToken = await getGscAccessToken();
  if (!accessToken) return [];

  const siteUrl = process.env.GSC_SITE_URL ?? "https://ethosattorney.com";
  const endDate = new Date(Date.now() - endDaysAgo * 86400000).toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - startDaysAgo * 86400000).toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit: limit,
          type: "web",
        }),
      }
    );

    if (!res.ok) {
      logger.warn("[gsc] query failed", res.status);
      return [];
    }

    const data: GscResponse = await res.json();
    return (data.rows ?? []).map((r) => ({
      query: r.keys[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Math.round(r.ctr * 1000) / 10,
      position: Math.round(r.position * 10) / 10,
    }));
  } catch (err) {
    logger.warn("[gsc] exception", err);
    return [];
  }
}

async function getGscAccessToken(): Promise<string | null> {
  const refreshToken = process.env.GSC_REFRESH_TOKEN?.trim();
  const clientId = process.env.GSC_CLIENT_ID?.trim();
  const clientSecret = process.env.GSC_CLIENT_SECRET?.trim();

  if (!refreshToken || !clientId || !clientSecret) return null;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}
