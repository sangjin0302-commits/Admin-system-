/**
 * 업무 분야 단일 소스(Single Source of Truth).
 *
 * 새 분야를 추가할 때 여기 한 곳에만 항목을 추가하면
 * 홈/서비스 인덱스/사례·후기·비용 분류/관리자 드롭다운 라벨이 함께 확장됩니다.
 *
 * (DB의 category는 자유 문자열이라 enum 마이그레이션이 필요 없습니다 —
 *  새 key를 PRACTICE_AREA_KEYS에 추가하면 검증·노출이 같이 늘어납니다.)
 */

export type PracticeAreaKey =
  | "VISA_STAY"
  | "ADMIN_APPEAL"
  | "CONTRACT_INVESTIGATION"
  | "LICENSE_PERMIT"
  | "CORP_FORMATION";

export type PracticeArea = {
  key: PracticeAreaKey;
  slug: string; // /services/<slug>
  label: string; // 한글 분류 라벨
  labelEn: string;
  subtitle: string; // 영문 부제 (카드)
  short: string; // 짧은 설명 (홈/인덱스 카드)
};

export const PRACTICE_AREAS: readonly PracticeArea[] = [
  {
    key: "VISA_STAY",
    slug: "immigration",
    label: "비자/체류",
    labelEn: "Visa / Stay",
    subtitle: "VISA & IMMIGRATION",
    short: "체류 자격 변경·연장, 사업/투자 비자, 강제퇴거 대응까지."
  },
  {
    key: "ADMIN_APPEAL",
    slug: "appeal",
    label: "행정심판",
    labelEn: "Administrative Appeal",
    subtitle: "ADMINISTRATIVE APPEAL",
    short: "처분 통지부터 청구·심리·재결까지 함께 준비합니다."
  },
  {
    key: "CONTRACT_INVESTIGATION",
    slug: "contract",
    label: "계약서/사실조사",
    labelEn: "Contract / Investigation",
    subtitle: "CONTRACT & INVESTIGATION",
    short: "계약 검토·작성, 분쟁 사실관계 조사, 조사보고서 작성."
  },
  {
    key: "LICENSE_PERMIT",
    slug: "license",
    label: "인허가",
    labelEn: "License / Permit",
    subtitle: "LICENSE & PERMIT",
    short: "사업·건축·식품·의료 등 허가 신청, 보완·불복 대응."
  },
  {
    key: "CORP_FORMATION",
    slug: "corporate",
    label: "법인 설립",
    labelEn: "Company Formation",
    subtitle: "CORPORATE FORMATION",
    short: "법인 설립 절차, 정관·등기 준비, 설립 후 인허가 연계까지."
  }
] as const;

export const PRACTICE_AREA_KEYS: PracticeAreaKey[] = PRACTICE_AREAS.map((a) => a.key);

export const PRACTICE_AREA_LABELS: Record<string, string> = Object.fromEntries(
  PRACTICE_AREAS.map((a) => [a.key, a.label])
);

export const PRACTICE_AREA_LABELS_EN: Record<string, string> = Object.fromEntries(
  PRACTICE_AREAS.map((a) => [a.key, a.labelEn])
);

export function getPracticeArea(key: string): PracticeArea | undefined {
  return PRACTICE_AREAS.find((a) => a.key === key);
}
