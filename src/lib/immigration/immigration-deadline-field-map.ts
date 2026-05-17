import {
  immigrationDeadlineFields,
  type ImmigrationDeadlineField,
  type ImmigrationMatterType
} from "@/lib/immigration/immigration-appeal-registry";

export type ImmigrationDeadlineFieldMapDefinition = {
  field: ImmigrationDeadlineField;
  labelKo: string;
  descriptionKo: string;
  sourceHintKo: string;
  isCritical: boolean;
  requiresManualVerification: boolean;
  recommendedCaseMatterDueDateCandidate: boolean;
};

export const IMMIGRATION_DEADLINE_FIELD_DEFINITIONS = [
  {
    field: "dispositionDate",
    labelKo: "처분일",
    descriptionKo: "출입국 행정처분이 이루어진 날짜입니다.",
    sourceHintKo: "처분서 또는 통지서 원문 기준",
    isCritical: true,
    requiresManualVerification: true,
    recommendedCaseMatterDueDateCandidate: false
  },
  {
    field: "noticeDate",
    labelKo: "통지일",
    descriptionKo: "처분 또는 보완요청을 통지받은 날짜입니다.",
    sourceHintKo: "처분서, 통지서, 전자통지 내역 기준",
    isCritical: true,
    requiresManualVerification: true,
    recommendedCaseMatterDueDateCandidate: false
  },
  {
    field: "serviceDate",
    labelKo: "송달일",
    descriptionKo: "불복기한 산정의 기준이 될 수 있는 송달 날짜입니다.",
    sourceHintKo: "우편/전자/직접 송달 자료 기준",
    isCritical: true,
    requiresManualVerification: true,
    recommendedCaseMatterDueDateCandidate: false
  },
  {
    field: "appealDeadline",
    labelKo: "불복/신청 기한",
    descriptionKo: "행정심판, 이의신청, 기타 불복 절차 검토 기한입니다.",
    sourceHintKo: "처분서 원문, 송달일, 적용 법령, 관할기관 기준",
    isCritical: true,
    requiresManualVerification: true,
    recommendedCaseMatterDueDateCandidate: true
  },
  {
    field: "departureDeadline",
    labelKo: "출국기한",
    descriptionKo: "출국명령, 출국권고 또는 관련 처분에서 정한 출국 기준일입니다.",
    sourceHintKo: "출국명령서/권고서 원문 기준",
    isCritical: true,
    requiresManualVerification: true,
    recommendedCaseMatterDueDateCandidate: true
  },
  {
    field: "detentionStartDate",
    labelKo: "보호 개시일",
    descriptionKo: "보호명령 또는 보호 관련 절차가 시작된 날짜입니다.",
    sourceHintKo: "보호명령서, 보호통지서, 기관 기록 기준",
    isCritical: true,
    requiresManualVerification: true,
    recommendedCaseMatterDueDateCandidate: false
  },
  {
    field: "stayExpiryDate",
    labelKo: "체류기간 만료일",
    descriptionKo: "현재 체류자격 또는 체류기간의 만료일입니다.",
    sourceHintKo: "외국인등록증, 체류허가서, 하이코리아/기관 확인 자료 기준",
    isCritical: true,
    requiresManualVerification: true,
    recommendedCaseMatterDueDateCandidate: true
  },
  {
    field: "submissionDeadline",
    labelKo: "제출기한",
    descriptionKo: "기관 제출 또는 자료 제출의 기준 기한입니다.",
    sourceHintKo: "기관 안내문, 보완요청서, 담당기관 확인 기준",
    isCritical: true,
    requiresManualVerification: true,
    recommendedCaseMatterDueDateCandidate: true
  },
  {
    field: "supplementDeadline",
    labelKo: "보완기한",
    descriptionKo: "보완 요청에 대응해야 하는 마감 기한입니다.",
    sourceHintKo: "보완요청서 원문, 전자통지, 담당기관 확인 기준",
    isCritical: true,
    requiresManualVerification: true,
    recommendedCaseMatterDueDateCandidate: true
  },
  {
    field: "resultExpectedDate",
    labelKo: "결과 예상일",
    descriptionKo: "기관 판단 또는 결과 수령 예상일입니다.",
    sourceHintKo: "기관 처리기간 안내 또는 담당기관 확인 기준",
    isCritical: false,
    requiresManualVerification: true,
    recommendedCaseMatterDueDateCandidate: false
  }
] as const satisfies readonly ImmigrationDeadlineFieldMapDefinition[];

export const IMMIGRATION_DEADLINE_PRIORITY = [
  "appealDeadline",
  "departureDeadline",
  "supplementDeadline",
  "stayExpiryDate",
  "submissionDeadline"
] as const satisfies readonly ImmigrationDeadlineField[];

export const IMMIGRATION_MATTER_TYPE_DEADLINE_MAP = {
  deportation_order_appeal: [
    "dispositionDate",
    "noticeDate",
    "serviceDate",
    "appealDeadline",
    "detentionStartDate",
    "submissionDeadline"
  ],
  departure_order_appeal: [
    "dispositionDate",
    "noticeDate",
    "serviceDate",
    "departureDeadline",
    "appealDeadline",
    "submissionDeadline"
  ],
  departure_recommendation_response: ["noticeDate", "departureDeadline", "submissionDeadline"],
  entry_ban_response: ["dispositionDate", "noticeDate", "serviceDate", "appealDeadline", "submissionDeadline"],
  stay_extension_denial_appeal: [
    "dispositionDate",
    "noticeDate",
    "serviceDate",
    "appealDeadline",
    "stayExpiryDate",
    "submissionDeadline"
  ],
  status_change_denial_appeal: [
    "dispositionDate",
    "noticeDate",
    "serviceDate",
    "appealDeadline",
    "stayExpiryDate",
    "submissionDeadline"
  ],
  overstay_penalty_response: ["noticeDate", "serviceDate", "submissionDeadline", "supplementDeadline"],
  immigration_offense_review: ["noticeDate", "serviceDate", "submissionDeadline", "supplementDeadline"],
  detention_or_protection_review: [
    "detentionStartDate",
    "noticeDate",
    "serviceDate",
    "appealDeadline",
    "submissionDeadline"
  ],
  refugee_or_humanitarian_status: [
    "dispositionDate",
    "noticeDate",
    "serviceDate",
    "appealDeadline",
    "submissionDeadline"
  ],
  visa_issuance_support: ["submissionDeadline", "resultExpectedDate"],
  residence_status_document_support: ["stayExpiryDate", "submissionDeadline", "supplementDeadline"],
  general_immigration_statement: ["submissionDeadline", "supplementDeadline"]
} as const satisfies Record<ImmigrationMatterType, readonly ImmigrationDeadlineField[]>;

const deadlineDefinitionByField = new Map<ImmigrationDeadlineField, ImmigrationDeadlineFieldMapDefinition>(
  IMMIGRATION_DEADLINE_FIELD_DEFINITIONS.map((definition) => [definition.field, definition])
);

const immigrationDeadlineFieldSet = new Set<string>(immigrationDeadlineFields);

export function isImmigrationDeadlineField(field: string): field is ImmigrationDeadlineField {
  return immigrationDeadlineFieldSet.has(field);
}

export function formatImmigrationDeadlineFieldLabel(field: string) {
  if (!isImmigrationDeadlineField(field)) return field || "-";
  return deadlineDefinitionByField.get(field)?.labelKo ?? field;
}

export function getImmigrationDeadlineFieldsForMatterType(matterType: string) {
  const fields = IMMIGRATION_MATTER_TYPE_DEADLINE_MAP[matterType as ImmigrationMatterType];
  if (!fields) return [];
  return fields
    .map((field) => deadlineDefinitionByField.get(field))
    .filter((definition): definition is ImmigrationDeadlineFieldMapDefinition => Boolean(definition));
}

export function getCriticalImmigrationDeadlineFieldsForMatterType(matterType: string) {
  return getImmigrationDeadlineFieldsForMatterType(matterType).filter((definition) => definition.isCritical);
}

export function getPrimaryDueDateCandidateFieldsForMatterType(matterType: string) {
  return getImmigrationDeadlineFieldsForMatterType(matterType).filter(
    (definition) => definition.recommendedCaseMatterDueDateCandidate
  );
}
