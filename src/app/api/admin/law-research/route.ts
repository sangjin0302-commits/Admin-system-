import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  searchLaw,
  searchEffectiveLaw,
  getLawDetail,
  searchPrecedent,
  getPrecedentDetail,
  searchInterpretation,
  getInterpretationDetail,
  searchAdminJudgment,
  getAdminJudgmentDetail,
  searchAdminRule,
  getAdminRuleDetail,
  searchForm,
  searchAdminRuleForm,
  searchOrdinanceForm,
  searchMinistryInterpretation,
  getMinistryInterpretationDetail,
  getLawFormFiles,
  getLawArticleByJo,
  searchOrdinance,
  searchTreaty,
  searchTarget,
  getDetail,
  searchMany,
  listTargets,
  listTargetsByGroup,
  searchSpecialAdminJudgment,
  searchConstitutionalDecision,
  searchLegalTerm,
  searchThreeWayCompare,
  searchOldAndNew,
  searchRelatedLaw,
  searchLawSystemMap,
  searchArticleFullText,
  searchRelatedArticles,
  searchPrecedentByNumber,
  searchLawExact,
  searchAdminRuleByType,
  TARGET_REGISTRY,
  MINISTRY_TARGETS,
  SPECIAL_DECC_TARGETS,
  ADMRUL_TYPE_TARGETS,
  type MinistryKey,
  type TargetKey,
  type SpecialDeccKind,
  type AdmRulTypeKey
} from "@/lib/services/law-api-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Action =
  | "searchLaw"
  | "searchEffectiveLaw"
  | "getLawDetail"
  | "searchPrecedent"
  | "getPrecedentDetail"
  | "searchInterpretation"
  | "getInterpretationDetail"
  | "searchAdminJudgment"
  | "getAdminJudgmentDetail"
  | "searchAdminRule"
  | "getAdminRuleDetail"
  | "searchForm"
  | "searchAdminRuleForm"
  | "searchOrdinanceForm"
  | "searchMinistryInterpretation"
  | "getMinistryInterpretationDetail"
  | "getLawFormFiles"
  | "getLawArticleByJo"
  | "searchOrdinance"
  | "searchTreaty"
  // 제네릭 (51개 target 전체 접근)
  | "searchTarget"
  | "getDetail"
  | "searchMany"
  | "listTargets"
  | "listTargetsByGroup"
  // 명명 래퍼
  | "searchSpecialAdminJudgment"
  | "searchConstitutionalDecision"
  | "searchLegalTerm"
  | "searchThreeWayCompare"
  | "searchOldAndNew"
  | "searchRelatedLaw"
  | "searchLawSystemMap"
  | "searchArticleFullText"
  | "searchRelatedArticles"
  | "searchPrecedentByNumber"
  | "searchLawExact"
  | "searchAdminRuleByType";

function toMinistryKey(v: unknown): MinistryKey | null {
  const k = String(v ?? "");
  return k in MINISTRY_TARGETS ? (k as MinistryKey) : null;
}

function toTargetKey(v: unknown): TargetKey | null {
  const k = String(v ?? "");
  return k in TARGET_REGISTRY ? (k as TargetKey) : null;
}

function toSpecialDeccKind(v: unknown): SpecialDeccKind | null {
  const k = String(v ?? "");
  return k in SPECIAL_DECC_TARGETS ? (k as SpecialDeccKind) : null;
}

function toAdmRulTypeKey(v: unknown): AdmRulTypeKey | null {
  const k = String(v ?? "");
  return k in ADMRUL_TYPE_TARGETS ? (k as AdmRulTypeKey) : null;
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.law-research");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("admin_law_copilot"))) {
    return api.error(403, "법령·판례 리서치 코파일럿 기능이 비활성화되어 있습니다.", {
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
      case "searchLaw":
        data = await searchLaw(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchEffectiveLaw":
        data = await searchEffectiveLaw(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "getLawDetail":
        data = await getLawDetail(String(p.mst ?? p.lawId ?? ""));
        break;
      case "getLawFormFiles":
        data = await getLawFormFiles(String(p.mst ?? ""));
        break;
      case "searchPrecedent":
        data = await searchPrecedent(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "getPrecedentDetail":
        data = await getPrecedentDetail(String(p.caseId ?? ""));
        break;
      case "searchInterpretation":
        data = await searchInterpretation(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "getInterpretationDetail":
        data = await getInterpretationDetail(String(p.interpId ?? ""));
        break;
      case "searchAdminJudgment":
        data = await searchAdminJudgment(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "getAdminJudgmentDetail":
        data = await getAdminJudgmentDetail(String(p.deccId ?? p.id ?? ""));
        break;
      case "searchMinistryInterpretation": {
        const ministry = toMinistryKey(p.ministry);
        if (!ministry) {
          return api.error(400, "지원하지 않는 부처입니다.", { code: "UNKNOWN_MINISTRY" });
        }
        data = await searchMinistryInterpretation(
          ministry,
          String(p.keyword ?? ""),
          Number(p.limit ?? 10)
        );
        break;
      }
      case "getMinistryInterpretationDetail": {
        const ministry = toMinistryKey(p.ministry);
        if (!ministry) {
          return api.error(400, "지원하지 않는 부처입니다.", { code: "UNKNOWN_MINISTRY" });
        }
        data = await getMinistryInterpretationDetail(
          ministry,
          String(p.interpId ?? p.id ?? "")
        );
        break;
      }
      case "searchAdminRule":
        data = await searchAdminRule(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "getAdminRuleDetail":
        data = await getAdminRuleDetail(String(p.ruleId ?? ""));
        break;
      case "searchForm":
        data = await searchForm(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchAdminRuleForm":
        data = await searchAdminRuleForm(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchOrdinanceForm":
        data = await searchOrdinanceForm(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "getLawArticleByJo":
        data = await getLawArticleByJo(
          String(p.mst ?? p.lawId ?? ""),
          String(p.article ?? p.jo ?? "")
        );
        break;
      case "searchOrdinance":
        data = await searchOrdinance(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchTreaty":
        data = await searchTreaty(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;

      // ---------- 제네릭 ----------
      case "searchTarget": {
        const target = toTargetKey(p.target);
        if (!target) {
          return api.error(400, "지원하지 않는 target입니다.", { code: "UNKNOWN_TARGET" });
        }
        data = await searchTarget(target, String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      }
      case "getDetail": {
        const target = toTargetKey(p.target);
        if (!target) {
          return api.error(400, "지원하지 않는 target입니다.", { code: "UNKNOWN_TARGET" });
        }
        data = await getDetail(target, String(p.id ?? ""));
        break;
      }
      case "searchMany": {
        const raw = Array.isArray(p.targets) ? p.targets : [];
        const targets: TargetKey[] = [];
        for (const t of raw) {
          const key = toTargetKey(t);
          if (!key) {
            return api.error(400, "지원하지 않는 target입니다.", { code: "UNKNOWN_TARGET" });
          }
          targets.push(key);
        }
        data = await searchMany(targets, String(p.keyword ?? ""), Number(p.limitEach ?? 3));
        break;
      }
      case "listTargets":
        data = listTargets({ includeUnsupported: Boolean(p.includeUnsupported) });
        break;
      case "listTargetsByGroup":
        data = listTargetsByGroup();
        break;

      // ---------- 명명 래퍼 ----------
      case "searchSpecialAdminJudgment": {
        const kind = toSpecialDeccKind(p.kind);
        if (!kind) {
          return api.error(400, "지원하지 않는 특별행정심판 유형입니다.", {
            code: "UNKNOWN_SPECIAL_DECC_KIND"
          });
        }
        data = await searchSpecialAdminJudgment(
          kind,
          String(p.keyword ?? ""),
          Number(p.limit ?? 10)
        );
        break;
      }
      case "searchAdminRuleByType": {
        const kind = toAdmRulTypeKey(p.kind);
        if (!kind) {
          return api.error(400, "지원하지 않는 행정규칙 유형입니다.", {
            code: "UNKNOWN_ADMRUL_TYPE"
          });
        }
        data = await searchAdminRuleByType(kind, String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      }
      case "searchConstitutionalDecision":
        data = await searchConstitutionalDecision(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchLegalTerm":
        data = await searchLegalTerm(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchThreeWayCompare":
        data = await searchThreeWayCompare(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchOldAndNew":
        data = await searchOldAndNew(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchRelatedLaw":
        data = await searchRelatedLaw(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchLawSystemMap":
        data = await searchLawSystemMap(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchArticleFullText":
        data = await searchArticleFullText(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchRelatedArticles":
        data = await searchRelatedArticles(String(p.keyword ?? ""), Number(p.limit ?? 10));
        break;
      case "searchPrecedentByNumber":
        data = await searchPrecedentByNumber(String(p.caseNumber ?? ""), Number(p.limit ?? 10));
        break;
      case "searchLawExact":
        data = await searchLawExact(String(p.name ?? ""), Number(p.limit ?? 10));
        break;

      default:
        return api.error(400, "지원하지 않는 action입니다.", { code: "UNKNOWN_ACTION" });
    }
    return api.ok({ ok: true, data });
  } catch (err) {
    api.logError(err);
    return api.error(500, "법령/판례 조회에 실패했습니다.", { code: "LAW_RESEARCH_FAILED" });
  }
}
