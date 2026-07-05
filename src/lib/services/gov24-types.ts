/**
 * 정부24 서류 발급 타입/상수/순수함수 — 서버·클라이언트 공용.
 * gov24-service.ts 는 prisma 를 import 하기 때문에 클라이언트 컴포넌트가
 * 직접 import 하면 webpack 이 node:fs 등을 번들에 포함시켜 빌드 실패.
 * 순수한 부분만 이 파일로 분리한다.
 */

export const GOV24_DOC_TYPES = [
  { code: "resident_extract", label: "주민등록등본" },
  { code: "resident_summary", label: "주민등록초본" },
  { code: "family_relation", label: "가족관계증명서" },
  { code: "biz_registration", label: "사업자등록증명" },
  { code: "seal_certificate", label: "인감증명" },
] as const;

export type Gov24DocCode = (typeof GOV24_DOC_TYPES)[number]["code"];

export type Gov24RequestStatus =
  | "REQUESTED"
  | "IN_PROGRESS"
  | "READY"
  | "DELIVERED"
  | "FAILED";

export type Gov24Request = {
  id: string;
  caseId?: string;
  requesterName?: string;
  requesterEmail?: string;
  docCode: Gov24DocCode;
  docLabel: string;
  ownerConsent: boolean;
  status: Gov24RequestStatus;
  requestedAt: string;
  estimatedTime?: string;
  note?: string;
  externalRef?: string;
};

export function getStandardRequestTemplate(
  type: Gov24DocCode,
  requesterName?: string,
): string {
  const def = GOV24_DOC_TYPES.find((d) => d.code === type);
  const label = def?.label ?? type;
  return [
    `[${label}] 발급 요청`,
    `요청자: ${requesterName ?? "(성명)"}`,
    `발급 목적: 법률 자문/사건 대리`,
    `본인 동의: 완료`,
    `채널: 정부24 (https://www.gov.kr)`,
  ].join("\n");
}
