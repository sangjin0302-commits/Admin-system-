/**
 * 법제처 DRF target 헬스체크.
 *
 * 법제처는 없는 target에도 빈 200을 주므로, 레지스트리가 실제로 살아 있는지는
 * 주기적으로 프로브를 날려 봐야만 알 수 있다. wrapper 이름이 바뀌거나 target이
 * 사라지면 searchTargetDetailed가 parse_error/upstream_error로 알려 준다.
 *
 * 결과는 SiteSetting `law.health.lastReport` 에 JSON으로 저장한다.
 */

import { prisma } from "@/lib/prisma/client";
import {
  listTargets,
  searchTargetDetailed,
  type LawFetchStatus,
  type TargetKey,
  type TargetSpec
} from "@/lib/services/law-api-service";
import {
  checkRegistryDrift,
  LOCKED_AT,
  type RegistryDrift
} from "@/lib/services/law-registry-lock";
import { logger } from "@/lib/utils/logger";

const REPORT_KEY = "law.health.lastReport";
const CONCURRENCY = 4;

export type TargetHealth = {
  target: TargetKey;
  label: string;
  group: string;
  status: LawFetchStatus;
  itemCount: number;
  message: string;
  checkedAt: string;
};

export type LawHealthReport = {
  checkedAt: string;
  total: number;
  ok: number;
  empty: number;
  failed: number; // upstream_error + parse_error
  skipped: number; // not_permitted
  results: TargetHealth[];
  drift: RegistryDrift[]; // baseline 이탈 (있으면 코드가 바뀐 것)
  lockedAt: string; // LOCKED_AT
};

/** 그룹마다 결과가 나올 법한 프로브 질의를 쓴다 — 0건이면 헬스체크 신호가 약해진다. */
function probeQuery(group: TargetSpec["group"]): string {
  switch (group) {
    case "법령":
    case "서식":
      return "건축";
    case "판례·심판":
      return "행정처분";
    case "해석":
      return "허가";
    case "위원회":
      return "건축";
    default:
      return "허가";
  }
}

async function checkOne(spec: TargetSpec): Promise<TargetHealth> {
  const outcome = await searchTargetDetailed(spec.key, probeQuery(spec.group), 1);
  return {
    target: spec.key,
    label: spec.label,
    group: spec.group,
    status: outcome.status,
    itemCount: outcome.items.length,
    message: outcome.message,
    checkedAt: new Date().toISOString()
  };
}

export async function runLawHealthCheck(): Promise<LawHealthReport> {
  const specs = listTargets(); // supported: true 만
  const results: TargetHealth[] = [];

  // 프록시를 한 번에 두들기지 않도록 4개씩 끊어서 돈다.
  for (let i = 0; i < specs.length; i += CONCURRENCY) {
    const chunk = specs.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      chunk.map(async (spec) => {
        try {
          return await checkOne(spec);
        } catch (err) {
          return {
            target: spec.key,
            label: spec.label,
            group: spec.group,
            status: "upstream_error" as LawFetchStatus,
            itemCount: 0,
            message: `헬스체크 예외: ${String(err)}`,
            checkedAt: new Date().toISOString()
          };
        }
      })
    );
    results.push(...settled);
  }

  // registry가 baseline에서 벗어났다면, 아무도 재검증하지 않은 채 코드가 바뀐 것이다.
  // 프로브가 전부 통과해도 이건 별도로 시끄러워야 한다.
  const drift = checkRegistryDrift();
  for (const d of drift) {
    logger.warn("law-health: registry 검증 기준선 이탈", {
      target: d.target,
      kind: d.kind,
      detail: d.detail,
      lockedAt: LOCKED_AT
    });
  }

  const report: LawHealthReport = {
    checkedAt: new Date().toISOString(),
    total: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    empty: results.filter((r) => r.status === "empty").length,
    failed: results.filter(
      (r) => r.status === "upstream_error" || r.status === "parse_error"
    ).length,
    skipped: results.filter((r) => r.status === "not_permitted").length,
    results,
    drift,
    lockedAt: LOCKED_AT
  };

  try {
    await prisma.siteSetting.upsert({
      where: { key: REPORT_KEY },
      create: { key: REPORT_KEY, value: JSON.stringify(report) },
      update: { value: JSON.stringify(report) }
    });
  } catch (err) {
    logger.warn("law-health: 리포트 저장 실패", { err: String(err) });
  }

  return report;
}

export async function getLastHealthReport(): Promise<LawHealthReport | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: REPORT_KEY } });
    if (!row?.value) return null;
    return JSON.parse(row.value) as LawHealthReport;
  } catch {
    return null;
  }
}
