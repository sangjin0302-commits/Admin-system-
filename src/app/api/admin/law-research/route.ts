import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { verifyCitations } from "@/lib/services/citation-verify-service";
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
  searchTargetDetailed,
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
import {
  runLawHealthCheck,
  getLastHealthReport
} from "@/lib/services/law-health-service";
import {
  checkRegistryDrift,
  LOCKED_AT,
  LOCKED_TARGET_COUNT
} from "@/lib/services/law-registry-lock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Action =
  | "diagnose"
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
  // 제네릭 (supported target 전체 접근)
  | "searchTarget"
  | "searchTargetDetailed"
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
  | "searchAdminRuleByType"
  // 헬스체크
  | "runLawHealthCheck"
  | "getLawHealthReport"
  | "checkRegistryLock"
  // 인용 검증
  | "verifyCitations";

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
      case "searchTargetDetailed": {
        const target = toTargetKey(p.target);
        if (!target) {
          return api.error(400, "지원하지 않는 target입니다.", { code: "UNKNOWN_TARGET" });
        }
        data = await searchTargetDetailed(
          target,
          String(p.keyword ?? ""),
          Number(p.limit ?? 10)
        );
        break;
      }
      case "runLawHealthCheck":
        data = await runLawHealthCheck();
        break;
      case "getLawHealthReport":
        data = await getLastHealthReport();
        break;
      /**
       * registry 잠금 점검 — 실호출 없이 baseline 대비 코드 상태만 본다.
       * drift가 비어 있지 않으면, 재검증 없이 registry가 수정된 것이다.
       */
      case "checkRegistryLock": {
        const all = Object.values(TARGET_REGISTRY);
        const supported = all.filter((s) => s.supported).length;
        data = {
          lockedAt: LOCKED_AT,
          expected: LOCKED_TARGET_COUNT,
          actual: {
            total: all.length,
            supported,
            unsupported: all.length - supported
          },
          drift: checkRegistryDrift()
        };
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

      /**
       * 진단용 — env 주입 여부와 Lightsail 프록시 도달 가능 여부를 확인한다.
       * 토큰/OC 값 자체는 반환하지 않고 존재 여부만 노출한다.
       */
      case "diagnose": {
        const url = process.env.LAW_PROXY_URL || "(unset)";
        const token = process.env.LAW_PROXY_TOKEN || "";
        const oc = process.env.LAW_OC || "";
        let health = "not attempted";
        let drf = "not attempted";
        try {
          const r = await fetch(`${url}/health`, {
            signal: AbortSignal.timeout(8000),
            cache: "no-store"
          });
          health = `HTTP ${r.status} ${(await r.text()).slice(0, 60)}`;
        } catch (e) {
          health = `ERROR ${String(e).slice(0, 160)}`;
        }
        try {
          const q = new URLSearchParams({
            OC: oc,
            type: "JSON",
            target: "law",
            query: "출입국관리법",
            display: "1",
            page: "1"
          });
          const r = await fetch(`${url}/drf/lawSearch.do?${q}`, {
            headers: { "X-Proxy-Token": token },
            signal: AbortSignal.timeout(8000),
            cache: "no-store"
          });
          drf = `HTTP ${r.status} ${(await r.text()).slice(0, 120)}`;
        } catch (e) {
          drf = `ERROR ${String(e).slice(0, 160)}`;
        }
        // 서비스 레이어를 실제로 태워 본다 — 위 drf가 200인데 이게 len=0이면
        // 원인은 env가 아니라 서비스 내부(envReady/캐시/파서)다.
        let serviceProbe = "not attempted";
        try {
          const rows = await searchLaw("출입국관리법", 1);
          serviceProbe = `len=${rows.length}${rows[0] ? ` first="${rows[0].title}"` : ""}`;
        } catch (e) {
          serviceProbe = `ERROR ${String(e).slice(0, 160)}`;
        }
        data = {
          hasProxyUrl: url !== "(unset)",
          proxyUrl: url,
          hasToken: Boolean(token),
          tokenLen: token.length,
          hasOc: Boolean(oc),
          ocValue: oc,
          health,
          drf,
          serviceProbe
        };
        break;
      }

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

      // ---------- 인용 검증 ----------
      case "verifyCitations": {
        const text = String(p.text ?? "");
        if (!text.trim()) {
          return api.error(400, "검증할 텍스트를 입력해 주세요.", {
            code: "MISSING_TEXT"
          });
        }
        const rawMax = Number(p.max ?? 15);
        const max = Number.isFinite(rawMax)
          ? Math.min(Math.max(Math.trunc(rawMax), 1), 30)
          : 15;
        data = await verifyCitations(text, max);
        break;
      }

      default:
        return api.error(400, "지원하지 않는 action입니다.", { code: "UNKNOWN_ACTION" });
    }
    return api.ok({ ok: true, data });
  } catch (err) {
    api.logError(err);
    return api.error(500, "법령/판례 조회에 실패했습니다.", { code: "LAW_RESEARCH_FAILED" });
  }
}
