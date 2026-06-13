export type PublicCase = {
  slug: string;
  category: "VISA_STAY" | "ADMIN_APPEAL" | "CONTRACT_INVESTIGATION" | "LICENSE_PERMIT";
  categoryLabel: string;
  title: string;
  summary: string;
  outcome: string;
  duration: string;
  background: string;
  approach: readonly string[];
  result: string;
  lessons: readonly string[];
};

export const PUBLIC_CASES: readonly PublicCase[] = [
  {
    slug: "f2-visa-change",
    category: "VISA_STAY",
    categoryLabel: "비자/체류",
    title: "F-2 자격 변경 신청",
    summary: "장기 체류 외국인의 자격 변경 요건 검토 및 신청 자료 정리.",
    outcome: "정상 접수, 보완 요청 1회 대응 후 처리.",
    duration: "약 3개월",
    background: "5년 이상 한국 체류 중인 의뢰인이 F-2 거주 자격으로의 변경을 희망하셨습니다. 점수제 평가 항목과 사실관계 정리가 필요했습니다.",
    approach: [
      "현재 체류 자격과 F-2 요건 비교",
      "점수제 항목별 필요 자료 정리",
      "재직 / 거주 / 가족관계 증빙 준비",
      "신청서 작성 및 접수"
    ],
    result: "접수 후 보완 요청 1회가 있었으며, 추가 자료 제출 후 정상 처리되었습니다.",
    lessons: [
      "F-2 자격은 점수제 평가가 핵심이며, 사전 점수 산정이 중요합니다.",
      "재직 기간, 거주 안정성, 한국어 능력 등이 주요 항목입니다.",
      "관련 증빙 자료는 신청 전 최소 4주 전 준비를 권장합니다."
    ]
  },
  {
    slug: "business-suspension-appeal",
    category: "ADMIN_APPEAL",
    categoryLabel: "행정심판",
    title: "영업정지 처분 행정심판 청구",
    summary: "영업정지 처분에 대한 청구 이유서 작성 및 증거자료 정리.",
    outcome: "재결까지 단계별 진행, 청구 이유 정리 완료.",
    duration: "약 4-6개월",
    background: "의뢰인의 사업장에 대한 영업정지 처분이 통지되었습니다. 처분 사유의 사실관계와 처분의 적정성을 다투기로 결정하였습니다.",
    approach: [
      "처분서 및 처분 근거 자료 검토",
      "처분일 / 통지일 / 청구기한 산정",
      "위법·부당 사유 정리",
      "증거자료 수집 및 청구 이유서 작성"
    ],
    result: "청구가 정상 접수되었고, 심리 단계까지 진행되었습니다. 재결 결과는 사안별로 다릅니다.",
    lessons: [
      "행정심판 청구기한 (처분을 안 날부터 90일)을 정확히 산정해야 합니다.",
      "처분 사유에 대한 반박 자료는 최대한 빠르게 정리하는 것이 좋습니다.",
      "재결 후 행정소송 진행 가능성을 함께 검토할 수 있습니다."
    ]
  },
  {
    slug: "service-contract-dispute",
    category: "CONTRACT_INVESTIGATION",
    categoryLabel: "계약서/사실조사",
    title: "용역계약 분쟁 사실조사",
    summary: "계약 내용 검토 및 분쟁 사실관계 정리.",
    outcome: "조사 보고서 납부, 의뢰인 후속 대응 자료로 활용.",
    duration: "약 1-2개월",
    background: "의뢰인이 체결한 용역 계약의 이행 과정에서 분쟁이 발생하였습니다. 사실관계를 명확히 정리한 보고서가 필요했습니다.",
    approach: [
      "계약서 / 견적서 / 협의 기록 검토",
      "이행 / 불이행 사실 시점별 정리",
      "관련 법령 및 판례 검토",
      "사실조사 보고서 작성"
    ],
    result: "조사 보고서 납부 후 의뢰인이 후속 협의 / 분쟁 대응에 활용하셨습니다.",
    lessons: [
      "분쟁 발생 시 계약 내용과 이행 시점을 정확히 정리하는 것이 중요합니다.",
      "통신 기록 (이메일, 문자, 카톡)은 사실관계 증명에 도움이 됩니다.",
      "초기에 사실조사 보고서를 확보하면 후속 협의가 수월합니다."
    ]
  },
  {
    slug: "restaurant-license",
    category: "LICENSE_PERMIT",
    categoryLabel: "인허가",
    title: "음식점 영업허가 신청",
    summary: "허가 요건 사전 검토 및 신청 서류 정리.",
    outcome: "보완 1회 후 허가 처리.",
    duration: "약 1-3개월",
    background: "신규 음식점 개업을 위한 영업허가 신청이 필요했습니다. 사업장 위치, 시설 요건, 위생 기준 검토가 필요했습니다.",
    approach: [
      "허가 관청 및 처리기한 사전 확인",
      "사업장 요건 (면적, 위생, 시설) 검토",
      "필수 / 권장 서류 정리",
      "신청 후 보완 요청 대응"
    ],
    result: "보완 요청 1회가 있었으며, 추가 자료 제출 후 허가가 처리되었습니다.",
    lessons: [
      "음식점 허가는 사업장 위치와 시설 요건이 핵심입니다.",
      "보건소 / 소방서 사전 협의를 권장합니다.",
      "보완 요청은 통상 1-2회 발생하며, 빠른 대응이 중요합니다."
    ]
  }
];

export function getPublicCaseBySlug(slug: string): PublicCase | undefined {
  return PUBLIC_CASES.find((c) => c.slug === slug);
}
