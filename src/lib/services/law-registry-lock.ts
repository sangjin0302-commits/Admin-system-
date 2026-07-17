/**
 * 법제처 registry 잠금 — 실측 검증된 상태의 기준선(baseline).
 *
 * 2026-07 프로덕션 헬스체크 통과 시점의 스냅샷이다: 83 target, 실패 0.
 * 여기 적힌 target/wrapper/itemKey 는 전부 라이브 응답으로 확인한 값이며,
 * 추측으로 바꾸지 말 것. 이 세션에서만 유령 이름 5건을 이렇게 잡았다:
 *   ccourt→detc / nodong→nlrc / acrc→acr / empins→eiac / mow→mogef
 *
 * 법제처는 존재하지 않는 target에도 빈 200을 주기 때문에, 이름이 틀려도
 * "결과 없음"과 구분되지 않는다. 그래서 코드가 아니라 이 baseline과
 * 헬스체크가 회귀를 잡는 유일한 장치다.
 *
 * registry를 의도적으로 바꿨다면:
 *   1) 반드시 프록시로 실호출해 wrapper/itemKey/필드를 확인하고
 *   2) 이 baseline을 함께 갱신할 것 (LOCKED_AT 도 함께)
 */

import { TARGET_REGISTRY } from "@/lib/services/law-api-service";

export const LOCKED_AT = "2026-07-17";
export const LOCKED_TARGET_COUNT = { total: 85, supported: 83, unsupported: 2 };

/** 실측 검증된 target → wrapper/itemKey 기준선 */
export const LOCKED_SPECS: Record<string, { wrappers: string[]; itemKeys: string[] }> = {
  law: { wrappers: ["LawSearch"], itemKeys: ["law"] },
  prec: { wrappers: ["PrecSearch"], itemKeys: ["prec"] },
  expc: { wrappers: ["Expc"], itemKeys: ["expc"] },
  decc: { wrappers: ["Decc"], itemKeys: ["decc"] },
  admrul: { wrappers: ["AdmRulSearch"], itemKeys: ["admrul"] },
  ordin: { wrappers: ["OrdinSearch"], itemKeys: ["law"] },
  trty: { wrappers: ["TrtySearch"], itemKeys: ["Trty"] },
  licbyl: { wrappers: ["licBylSearch"], itemKeys: ["licbyl"] },
  admbyl: { wrappers: ["admRulBylSearch"], itemKeys: ["admrulbyl"] },
  ordinbyl: { wrappers: ["licBylSearch"], itemKeys: ["ordinbyl"] },
  molitCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  moelCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  ntsCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mojCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mofCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mssCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  kcsCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mpvaCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  molegCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  moefCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mogefCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  moeCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  msitCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mndCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  moisCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mafraCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mcstCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mohwCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  motieCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mofaCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  meCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mfdsCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mpmCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  kmaCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  khsCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  rdaCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  npaCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  dapaCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  mmaCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  kfsCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  nfaCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  okaCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  ppsCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  kdcaCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  kostatCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  kipoCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  kcgCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  naaccCgmExpc: { wrappers: ["CgmExpc"], itemKeys: ["cgmExpc"] },
  ttSpecialDecc: { wrappers: ["Decc"], itemKeys: ["decc"] },
  kmstSpecialDecc: { wrappers: ["Decc"], itemKeys: ["decc"] },
  acrSpecialDecc: { wrappers: ["Decc"], itemKeys: ["decc"] },
  adapSpecialDecc: { wrappers: ["Decc"], itemKeys: ["decc"] },
  detc: { wrappers: ["DetcSearch"], itemKeys: ["Detc"] },
  lstrm: { wrappers: ["LsTrmSearch"], itemKeys: ["lstrm"] },
  lstrmAI: { wrappers: ["lstrmAISearch"], itemKeys: ["법령용어"] },
  dlytrm: { wrappers: ["dlytrmSearch"], itemKeys: ["일상용어"] },
  thdCmp: { wrappers: ["thdCmpLawSearch"], itemKeys: ["thdCmp"] },
  oldAndNew: { wrappers: ["OldAndNewLawSearch"], itemKeys: ["oldAndNew"] },
  admrulOldAndNew: { wrappers: ["OldAndNewLawSearch"], itemKeys: ["oldAndNew"] },
  lsRlt: { wrappers: ["lsRltSearch", "Law", "LawSearch"], itemKeys: ["법령", "law"] },
  lnkLs: { wrappers: ["LawSearch"], itemKeys: ["law"] },
  lnkOrd: { wrappers: ["OrdinSearch"], itemKeys: ["law"] },
  lsStmd: { wrappers: ["LsStmdSearch"], itemKeys: ["law"] },
  oneview: { wrappers: ["items"], itemKeys: ["item"] },
  nhrck: { wrappers: ["Nhrck"], itemKeys: ["nhrck"] },
  eflaw: { wrappers: ["LawSearch", "EflawSearch"], itemKeys: ["law"] },
  elaw: { wrappers: ["LawSearch"], itemKeys: ["law"] },
  ftc: { wrappers: ["Ftc"], itemKeys: ["ftc"] },
  fsc: { wrappers: ["Fsc"], itemKeys: ["fsc"] },
  ppc: { wrappers: ["Ppc"], itemKeys: ["ppc"] },
  kcc: { wrappers: ["Kcc"], itemKeys: ["kcc"] },
  sfc: { wrappers: ["Sfc"], itemKeys: ["sfc"] },
  eiac: { wrappers: ["Eiac"], itemKeys: ["eiac"] },
  oclt: { wrappers: ["Oclt"], itemKeys: ["oclt"] },
  iaciac: { wrappers: ["Iaciac"], itemKeys: ["iaciac"] },
  ecc: { wrappers: ["Ecc"], itemKeys: ["ecc"] },
  school: { wrappers: ["AdmRulSearch"], itemKeys: ["admrul"] },
  public: { wrappers: ["AdmRulSearch"], itemKeys: ["admrul"] },
  pi: { wrappers: ["AdmRulSearch"], itemKeys: ["admrul"] },
  aiSearch: { wrappers: ["aiSearch"], itemKeys: ["법령조문"] },
  aiRltLs: { wrappers: ["aiRltLsSearch"], itemKeys: ["법령조문"] },
  nlrc: { wrappers: ["Nlrc"], itemKeys: ["nlrc"] },
  acr: { wrappers: ["Acr"], itemKeys: ["acr"] }
};

export type RegistryDrift = {
  target: string;
  kind: "missing" | "added" | "wrapper_changed" | "itemkey_changed" | "support_changed";
  detail: string;
};

function sameArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** 현재 registry가 baseline에서 벗어났는지 검사한다. 빈 배열이면 일치. */
export function checkRegistryDrift(): RegistryDrift[] {
  const drift: RegistryDrift[] = [];
  const all = Object.values(TARGET_REGISTRY);
  const supportedNow = new Map(
    all.filter((s) => s.supported).map((s) => [s.key as string, s])
  );

  // 개수 기준선 — 항목이 통째로 사라지거나 늘어난 경우를 먼저 잡는다.
  const counts = {
    total: all.length,
    supported: supportedNow.size,
    unsupported: all.length - supportedNow.size
  };
  for (const k of ["total", "supported", "unsupported"] as const) {
    if (counts[k] !== LOCKED_TARGET_COUNT[k]) {
      drift.push({
        target: "(registry)",
        kind: "support_changed",
        detail: `${k} 개수가 ${LOCKED_TARGET_COUNT[k]} → ${counts[k]} 로 바뀌었습니다`
      });
    }
  }

  for (const [key, locked] of Object.entries(LOCKED_SPECS)) {
    const spec = supportedNow.get(key);
    if (!spec) {
      const exists = (TARGET_REGISTRY as Record<string, unknown>)[key];
      drift.push({
        target: key,
        kind: exists ? "support_changed" : "missing",
        detail: exists
          ? "검증된 target이 supported: false 로 바뀌었습니다"
          : "검증된 target이 registry에서 사라졌습니다"
      });
      continue;
    }
    if (!sameArray(spec.wrappers, locked.wrappers)) {
      drift.push({
        target: key,
        kind: "wrapper_changed",
        detail: `wrappers [${locked.wrappers.join(", ")}] → [${spec.wrappers.join(", ")}]`
      });
    }
    if (!sameArray(spec.itemKeys, locked.itemKeys)) {
      drift.push({
        target: key,
        kind: "itemkey_changed",
        detail: `itemKeys [${locked.itemKeys.join(", ")}] → [${spec.itemKeys.join(", ")}]`
      });
    }
  }

  for (const key of supportedNow.keys()) {
    if (!(key in LOCKED_SPECS)) {
      drift.push({
        target: key,
        kind: "added",
        detail: "baseline에 없는 supported target입니다 — 실호출 검증 후 LOCKED_SPECS에 추가하세요"
      });
    }
  }

  return drift;
}
