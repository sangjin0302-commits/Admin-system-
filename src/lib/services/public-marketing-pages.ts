export type PublicMarketingServiceSlug =
  | "visa"
  | "corporation"
  | "administrative-appeal"
  | "fact-contract"
  | "permit-license"
  | "arabic-interpretation"
  | "civil-petition";

export type PublicMarketingService = {
  slug: PublicMarketingServiceSlug;
  practiceArea: string;
  title: string;
  shortTitle: string;
  summary: string;
  audience: string[];
  scope: string[];
  preparation: string[];
  process: string[];
  cautions: string[];
};

export const PUBLIC_MARKETING_SAFE_NOTICE =
  "안내 내용은 일반 정보 제공 목적이며, 실제 진행 가능 여부와 절차는 사안별 검토 및 공식 기관 확인이 필요합니다.";

export const PUBLIC_MARKETING_PREOPENING_NOTICE =
  "개업 전 운영 모드가 필요한 경우, 이 영역은 사전 상담 준비 안내 배너로 전환할 수 있습니다.";

export const PUBLIC_MARKETING_SERVICES: PublicMarketingService[] = [
  {
    slug: "visa",
    practiceArea: "visa",
    title: "비자 및 체류 업무",
    shortTitle: "비자",
    summary: "체류자격, 연장, 변경, 초청 등 외국인 체류 관련 행정 절차를 정리합니다.",
    audience: ["체류기간 연장 또는 자격 변경을 준비하는 외국인", "가족·사업·취업 관련 초청을 검토하는 분"],
    scope: ["체류 목적과 현재 상태 정리", "필요 서류 목록 점검", "공식 기관 안내 기준 확인"],
    preparation: ["여권 및 외국인등록 관련 자료", "체류 목적을 설명할 수 있는 자료", "소득·재직·사업 관련 자료"],
    process: ["기초 정보 접수", "사안별 쟁점 확인", "준비 자료 안내", "공식 접수 가능성 검토"],
    cautions: ["체류자격별 요건은 수시로 달라질 수 있습니다.", "최종 판단은 관할 기관 기준에 따릅니다."]
  },
  {
    slug: "corporation",
    practiceArea: "corporation",
    title: "법인 및 사업 행정",
    shortTitle: "법인",
    summary: "법인 설립 이후 행정 신고, 변경, 증명, 대외 제출 자료 준비를 돕습니다.",
    audience: ["법인 설립 또는 변경 신고를 준비하는 사업자", "대외 기관 제출 서류를 정리해야 하는 담당자"],
    scope: ["사업 목적과 제출처 확인", "기본 증빙 목록 정리", "신고·신청 절차 검토"],
    preparation: ["법인 기본 정보", "사업자등록 관련 자료", "정관·등기·계약 관련 참고 자료"],
    process: ["업무 목적 확인", "제출처 요건 확인", "자료 정리", "후속 절차 안내"],
    cautions: ["세무·회계·등기 판단은 해당 전문가 확인이 필요할 수 있습니다.", "제출처별 요구 양식이 다를 수 있습니다."]
  },
  {
    slug: "administrative-appeal",
    practiceArea: "administrative_appeal",
    title: "행정심판 및 이의신청",
    shortTitle: "행정심판",
    summary: "처분 통지 이후 불복 가능 기간, 사실관계, 제출 자료를 정리합니다.",
    audience: ["행정처분 통지를 받은 분", "이의신청 또는 행정심판 가능성을 검토하는 분"],
    scope: ["처분서와 통지 내용 확인", "불복 기간 검토", "사실관계와 증빙 정리"],
    preparation: ["처분서 또는 통지서", "기존 신청·민원 자료", "사실관계를 뒷받침하는 증빙"],
    process: ["처분 내용 확인", "기한과 쟁점 정리", "자료 보완 안내", "공식 절차 검토"],
    cautions: ["기한 경과 여부가 중요합니다.", "구체 사안은 법률 전문가 검토가 필요할 수 있습니다."]
  },
  {
    slug: "fact-contract",
    practiceArea: "fact_contract",
    title: "사실조사 및 계약서 작성",
    shortTitle: "사실조사·계약서",
    summary: "사실관계 정리, 확인서, 계약서 초안 검토 전 자료 구조화를 지원합니다.",
    audience: ["사실관계를 문서로 정리해야 하는 분", "계약 조건을 명확히 기록하려는 개인·사업자"],
    scope: ["사실관계 타임라인 정리", "관련 자료 목록화", "문서 목적과 제출처 확인"],
    preparation: ["당사자 정보", "거래·대화·입금 등 관련 자료", "기존 계약서 또는 합의 자료"],
    process: ["문서 목적 확인", "사실관계 정리", "필요 항목 점검", "작성 방향 안내"],
    cautions: ["권리관계 판단은 별도 법률 검토가 필요할 수 있습니다.", "허위 또는 과장된 내용은 포함할 수 없습니다."]
  },
  {
    slug: "permit-license",
    practiceArea: "permit_license",
    title: "인허가 및 등록",
    shortTitle: "인허가",
    summary: "사업 인허가, 등록, 신고 절차에서 필요한 요건과 준비 자료를 정리합니다.",
    audience: ["신규 사업 인허가를 준비하는 분", "등록·신고 요건을 확인해야 하는 사업자"],
    scope: ["업종과 관할 기관 확인", "기본 요건 점검", "신청 자료 목록 정리"],
    preparation: ["사업장 정보", "대표자·법인 자료", "시설·장비·자격 관련 증빙"],
    process: ["업종 확인", "관할 기관 기준 확인", "자료 준비", "신청 절차 안내"],
    cautions: ["업종별 세부 기준이 다릅니다.", "현장 확인 또는 보완 요구가 발생할 수 있습니다."]
  },
  {
    slug: "arabic-interpretation",
    practiceArea: "arabic_interpretation",
    title: "아랍어 통번역",
    shortTitle: "아랍어 통번역",
    summary: "아랍어권 고객과 행정 절차 사이에서 문서·상담 내용을 정확히 정리합니다.",
    audience: ["아랍어 자료 번역이 필요한 분", "아랍어권 고객 응대가 필요한 기관·사업자"],
    scope: ["문서 목적 확인", "번역 범위와 제출처 확인", "상담 내용 정리"],
    preparation: ["원문 파일 또는 이미지", "제출처와 사용 목적", "표기 기준이 필요한 이름·주소 정보"],
    process: ["자료 수령", "용도 확인", "번역·검토 범위 정리", "후속 안내"],
    cautions: ["공증·인증 필요 여부는 제출처 기준을 확인해야 합니다.", "전문 용어는 문맥 확인이 필요합니다."]
  },
  {
    slug: "civil-petition",
    practiceArea: "civil_petition",
    title: "기타 민원 및 행정 상담",
    shortTitle: "기타 민원",
    summary: "분야가 명확하지 않은 민원도 접수 후 적절한 절차와 준비 자료를 정리합니다.",
    audience: ["어느 기관에 문의해야 할지 모르는 분", "복합 민원 자료를 정리해야 하는 분"],
    scope: ["민원 목적 확인", "관련 기관 후보 정리", "기초 자료 점검"],
    preparation: ["민원 배경 설명", "기존 문의·답변 자료", "관련 사진·문서·통지서"],
    process: ["기초 상담 접수", "업무 분야 분류", "자료 보완 안내", "가능 절차 검토"],
    cautions: ["관할 기관이 여러 곳일 수 있습니다.", "사안에 따라 다른 전문가 연결이 필요할 수 있습니다."]
  }
];

export function getPublicMarketingService(slug: string) {
  return PUBLIC_MARKETING_SERVICES.find((service) => service.slug === slug) ?? null;
}

export function buildServiceIntakeHref(service: Pick<PublicMarketingService, "practiceArea">) {
  const params = new URLSearchParams({
    source: "website",
    channel: "service_page",
    practice_area: service.practiceArea
  });

  return `/intake?${params.toString()}`;
}
