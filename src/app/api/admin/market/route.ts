/**
 * 시장·경쟁사 분석 admin API.
 *
 * generateReport 액션만 AI를 호출합니다 (1시간 캐시, 버튼 클릭 시에만).
 * 나머지 액션은 DB 조회/수집으로 AI 비용 0.
 */

import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  collectMarket,
  collectTrends,
  getCompetitor,
  getMarketDashboard,
  getTrends,
  listCompetitors,
  listDocuments,
  rebuildCompetitorProfiles,
} from "@/lib/services/market-collect-service";
import { generateMarketReport } from "@/lib/services/market-report-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Action =
  | "getDashboard"
  | "listCompetitors"
  | "getCompetitor"
  | "listDocuments"
  | "collectNow"
  | "generateReport"
  | "getTrends";

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.market");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("admin_market_analysis"))) {
    return api.error(403, "시장·경쟁사 분석 기능이 비활성화되어 있습니다.", {
      code: "FEATURE_DISABLED",
    });
  }

  const body = await safeReadJsonBody(req);
  if (!body.ok) {
    return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
  }

  const { action, params } = (body.body ?? {}) as {
    action?: Action;
    params?: Record<string, unknown>;
  };
  const p = params ?? {};

  try {
    let data: unknown;
    switch (action) {
      case "getDashboard":
        data = await getMarketDashboard();
        break;
      case "listCompetitors":
        data = await listCompetitors(Number(p.limit ?? 50));
        break;
      case "getCompetitor": {
        const key = String(p.competitorKey ?? "");
        if (!key) return api.error(400, "competitorKey가 필요합니다.", { code: "MISSING_KEY" });
        data = await getCompetitor(key);
        break;
      }
      case "listDocuments":
        data = await listDocuments({
          sentiment: p.sentiment ? String(p.sentiment) : undefined,
          limit: Number(p.limit ?? 30),
        });
        break;
      case "getTrends":
        data = await getTrends();
        break;
      case "collectNow": {
        if (!(await isFeatureEnabled("market_collect"))) {
          return api.error(403, "시장 데이터 수집 기능이 비활성화되어 있습니다.", {
            code: "FEATURE_DISABLED",
          });
        }
        const collected = await collectMarket({ limitPerQuery: Number(p.limitPerQuery ?? 10) });
        const competitors = await rebuildCompetitorProfiles();
        const trends = await collectTrends();
        data = { collected, competitors, trends };
        break;
      }
      case "generateReport": {
        if (!(await isFeatureEnabled("market_ai_report"))) {
          return api.error(403, "시장 AI 리포트 기능이 비활성화되어 있습니다.", {
            code: "FEATURE_DISABLED",
          });
        }
        data = await generateMarketReport();
        break;
      }
      default:
        return api.error(400, "지원하지 않는 action입니다.", { code: "UNKNOWN_ACTION" });
    }

    return api.ok({ ok: true, data });
  } catch (err) {
    api.logError(err);
    return api.error(500, "요청 처리 중 오류가 발생했습니다.", { code: "INTERNAL_ERROR" });
  }
}
