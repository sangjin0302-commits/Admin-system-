import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  searchLifeLaw,
  listLifeClasses,
  listLifeAreas,
  getLifeAskNotices,
  getLifeLawsSystem,
  getLifePrecedents,
  getLifeAdminReferees,
  getLifeInterpretations,
  getLifeConstitutional,
  getLifeRuleSummary,
  getLifeRuleAreaClasses,
  getLifeMovies,
  getLifeEbooks,
  getLifeCaseBundle,
  type LifeKeys
} from "@/lib/services/easylaw-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Action =
  | "searchLifeLaw"
  | "listLifeClasses"
  | "listLifeAreas"
  | "getLifeAskNotices"
  | "getLifeLawsSystem"
  | "getLifePrecedents"
  | "getLifeAdminReferees"
  | "getLifeInterpretations"
  | "getLifeConstitutional"
  | "getLifeRuleSummary"
  | "getLifeRuleAreaClasses"
  | "getLifeMovies"
  | "getLifeEbooks"
  | "getLifeCaseBundle";

function toKeys(p: Record<string, unknown>): LifeKeys {
  return {
    csmSeq: String(p.csmSeq ?? ""),
    ccfNo: String(p.ccfNo ?? ""),
    cciNo: String(p.cciNo ?? ""),
    cnpClsNo: String(p.cnpClsNo ?? "")
  };
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.easylaw");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("admin_easylaw"))) {
    return api.error(403, "생활법령정보 조회 기능이 비활성화되어 있습니다.", {
      code: "FEATURE_DISABLED"
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
      case "searchLifeLaw":
        data = await searchLifeLaw(
          String(p.query ?? ""),
          Number(p.page ?? 1),
          Number(p.pageSize ?? 5)
        );
        break;
      case "listLifeClasses":
        data = await listLifeClasses();
        break;
      case "listLifeAreas":
        data = await listLifeAreas(String(p.csmAstSeq ?? ""));
        break;
      case "getLifeAskNotices":
        data = await getLifeAskNotices(String(p.csmSeq ?? ""));
        break;
      case "getLifeLawsSystem":
        data = await getLifeLawsSystem(String(p.csmSeq ?? ""));
        break;
      case "getLifePrecedents":
        data = await getLifePrecedents(toKeys(p));
        break;
      case "getLifeAdminReferees":
        data = await getLifeAdminReferees(toKeys(p));
        break;
      case "getLifeInterpretations":
        data = await getLifeInterpretations(toKeys(p));
        break;
      case "getLifeConstitutional":
        data = await getLifeConstitutional(toKeys(p));
        break;
      case "getLifeRuleSummary":
        data = await getLifeRuleSummary(toKeys(p));
        break;
      case "getLifeRuleAreaClasses":
        data = await getLifeRuleAreaClasses(String(p.csmSeq ?? ""));
        break;
      case "getLifeMovies":
        data = await getLifeMovies();
        break;
      case "getLifeEbooks":
        data = await getLifeEbooks();
        break;
      case "getLifeCaseBundle":
        data = await getLifeCaseBundle(toKeys(p));
        break;
      default:
        return api.error(400, "지원하지 않는 action입니다.", { code: "UNKNOWN_ACTION" });
    }
    return api.ok({ ok: true, data });
  } catch (err) {
    api.logError(err);
    return api.error(500, "생활법령정보 조회에 실패했습니다.", { code: "EASYLAW_FAILED" });
  }
}
