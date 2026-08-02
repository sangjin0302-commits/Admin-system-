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
  titleEn: string;
  shortTitle: string;
  summary: string;
  summaryEn: string;
  audience: string[];
  audienceEn: string[];
  scope: string[];
  scopeEn: string[];
  preparation: string[];
  preparationEn: string[];
  process: string[];
  processEn: string[];
  cautions: string[];
  cautionsEn: string[];
};

export const PUBLIC_MARKETING_SAFE_NOTICE =
  "안내 내용은 일반 정보 제공 목적이며, 실제 진행 가능 여부와 절차는 사안별 검토 및 공식 기관 확인이 필요합니다.";

export const PUBLIC_MARKETING_SAFE_NOTICE_EN =
  "This is general information only; feasibility and procedures require case-by-case review and confirmation with the official agency.";

export const PUBLIC_MARKETING_PREOPENING_NOTICE =
  "개업 전 운영 모드가 필요한 경우, 이 영역은 사전 상담 준비 안내 배너로 전환할 수 있습니다.";

export const PUBLIC_MARKETING_SERVICES: PublicMarketingService[] = [
  {
    slug: "visa",
    practiceArea: "visa",
    title: "비자 및 체류 업무",
    titleEn: "Visa & Residency",
    shortTitle: "비자",
    summary: "체류자격, 연장, 변경, 초청 등 외국인 체류 관련 행정 절차를 정리합니다.",
    summaryEn: "We organize administrative procedures for foreign residency — status, extension, change, and invitation.",
    audience: ["체류기간 연장 또는 자격 변경을 준비하는 외국인", "가족·사업·취업 관련 초청을 검토하는 분"],
    audienceEn: ["Foreign residents preparing an extension or status change", "Those reviewing family, business, or employment invitations"],
    scope: ["체류 목적과 현재 상태 정리", "필요 서류 목록 점검", "공식 기관 안내 기준 확인"],
    scopeEn: ["Organizing your residency purpose and current status", "Checking the required document list", "Confirming official agency criteria"],
    preparation: ["여권 및 외국인등록 관련 자료", "체류 목적을 설명할 수 있는 자료", "소득·재직·사업 관련 자료"],
    preparationEn: ["Passport and alien registration records", "Materials explaining your residency purpose", "Income, employment, or business records"],
    process: ["기초 정보 접수", "사안별 쟁점 확인", "준비 자료 안내", "공식 접수 가능성 검토"],
    processEn: ["Intake of basic information", "Identifying case-specific issues", "Guiding required documents", "Reviewing official filing feasibility"],
    cautions: ["체류자격별 요건은 수시로 달라질 수 있습니다.", "최종 판단은 관할 기관 기준에 따릅니다."],
    cautionsEn: ["Requirements per status can change at any time.", "Final decisions follow the competent agency's criteria."]
  },
  {
    slug: "corporation",
    practiceArea: "corporation",
    title: "법인 및 사업 행정",
    titleEn: "Corporate & Business Administration",
    shortTitle: "법인",
    summary: "법인 설립 이후 행정 신고, 변경, 증명, 대외 제출 자료 준비를 돕습니다.",
    summaryEn: "We help with post-formation filings, changes, certificates, and preparing documents for external submission.",
    audience: ["법인 설립 또는 변경 신고를 준비하는 사업자", "대외 기관 제출 서류를 정리해야 하는 담당자"],
    audienceEn: ["Businesses preparing a formation or change filing", "Staff who must organize documents for external agencies"],
    scope: ["사업 목적과 제출처 확인", "기본 증빙 목록 정리", "신고·신청 절차 검토"],
    scopeEn: ["Confirming business purpose and recipient agency", "Organizing the basic evidence list", "Reviewing filing/application procedures"],
    preparation: ["법인 기본 정보", "사업자등록 관련 자료", "정관·등기·계약 관련 참고 자료"],
    preparationEn: ["Basic corporate information", "Business registration records", "Articles, registration, and contract references"],
    process: ["업무 목적 확인", "제출처 요건 확인", "자료 정리", "후속 절차 안내"],
    processEn: ["Confirming the objective", "Checking recipient requirements", "Organizing documents", "Guiding follow-up steps"],
    cautions: ["세무·회계·등기 판단은 해당 전문가 확인이 필요할 수 있습니다.", "제출처별 요구 양식이 다를 수 있습니다."],
    cautionsEn: ["Tax, accounting, and registration decisions may need the relevant specialist.", "Required forms differ by recipient agency."]
  },
  {
    slug: "administrative-appeal",
    practiceArea: "administrative_appeal",
    title: "행정심판 및 이의신청",
    titleEn: "Administrative Appeal & Objection",
    shortTitle: "행정심판",
    summary: "처분 통지 이후 불복 가능 기간, 사실관계, 제출 자료를 정리합니다.",
    summaryEn: "After a disposition notice, we organize the appeal window, the facts, and the documents to submit.",
    audience: ["행정처분 통지를 받은 분", "이의신청 또는 행정심판 가능성을 검토하는 분"],
    audienceEn: ["Those who received an administrative disposition notice", "Those weighing an objection or administrative appeal"],
    scope: ["처분서와 통지 내용 확인", "불복 기간 검토", "사실관계와 증빙 정리"],
    scopeEn: ["Reviewing the disposition and notice", "Checking the appeal deadline", "Organizing facts and evidence"],
    preparation: ["처분서 또는 통지서", "기존 신청·민원 자료", "사실관계를 뒷받침하는 증빙"],
    preparationEn: ["The disposition or notice document", "Prior application/petition records", "Evidence supporting the facts"],
    process: ["처분 내용 확인", "기한과 쟁점 정리", "자료 보완 안내", "공식 절차 검토"],
    processEn: ["Reviewing the disposition", "Organizing deadline and issues", "Guiding supplementary materials", "Reviewing the official procedure"],
    cautions: ["기한 경과 여부가 중요합니다.", "구체 사안은 법률 전문가 검토가 필요할 수 있습니다."],
    cautionsEn: ["Whether the deadline has passed is critical.", "Specific matters may require a legal specialist's review."]
  },
  {
    slug: "fact-contract",
    practiceArea: "fact_contract",
    title: "사실조사 및 계약서 작성",
    titleEn: "Fact-finding & Contract Drafting",
    shortTitle: "사실조사·계약서",
    summary: "사실관계 정리, 확인서, 계약서 초안 검토 전 자료 구조화를 지원합니다.",
    summaryEn: "We help structure the facts, statements, and materials before drafting or reviewing a contract.",
    audience: ["사실관계를 문서로 정리해야 하는 분", "계약 조건을 명확히 기록하려는 개인·사업자"],
    audienceEn: ["Those who must document the facts", "Individuals/businesses wanting clear contract terms on record"],
    scope: ["사실관계 타임라인 정리", "관련 자료 목록화", "문서 목적과 제출처 확인"],
    scopeEn: ["Building a timeline of the facts", "Listing related materials", "Confirming the document's purpose and recipient"],
    preparation: ["당사자 정보", "거래·대화·입금 등 관련 자료", "기존 계약서 또는 합의 자료"],
    preparationEn: ["Party information", "Transaction, message, and payment records", "Existing contracts or agreements"],
    process: ["문서 목적 확인", "사실관계 정리", "필요 항목 점검", "작성 방향 안내"],
    processEn: ["Confirming the document's purpose", "Organizing the facts", "Checking required items", "Guiding the drafting direction"],
    cautions: ["권리관계 판단은 별도 법률 검토가 필요할 수 있습니다.", "허위 또는 과장된 내용은 포함할 수 없습니다."],
    cautionsEn: ["Judging legal rights may require separate legal review.", "False or exaggerated content cannot be included."]
  },
  {
    slug: "permit-license",
    practiceArea: "permit_license",
    title: "인허가 및 등록",
    titleEn: "Permits & Registration",
    shortTitle: "인허가",
    summary: "사업 인허가, 등록, 신고 절차에서 필요한 요건과 준비 자료를 정리합니다.",
    summaryEn: "We organize the requirements and materials for business permits, registrations, and filings.",
    audience: ["신규 사업 인허가를 준비하는 분", "등록·신고 요건을 확인해야 하는 사업자"],
    audienceEn: ["Those preparing a new business permit", "Businesses that must verify registration/filing requirements"],
    scope: ["업종과 관할 기관 확인", "기본 요건 점검", "신청 자료 목록 정리"],
    scopeEn: ["Confirming the industry and competent agency", "Checking basic requirements", "Organizing the application document list"],
    preparation: ["사업장 정보", "대표자·법인 자료", "시설·장비·자격 관련 증빙"],
    preparationEn: ["Business site information", "Representative/corporate records", "Facility, equipment, and qualification evidence"],
    process: ["업종 확인", "관할 기관 기준 확인", "자료 준비", "신청 절차 안내"],
    processEn: ["Confirming the industry", "Checking the competent agency's criteria", "Preparing documents", "Guiding the application procedure"],
    cautions: ["업종별 세부 기준이 다릅니다.", "현장 확인 또는 보완 요구가 발생할 수 있습니다."],
    cautionsEn: ["Detailed criteria differ by industry.", "On-site checks or supplement requests may occur."]
  },
  {
    slug: "arabic-interpretation",
    practiceArea: "arabic_interpretation",
    title: "아랍어 통번역",
    titleEn: "Arabic Interpretation & Translation",
    shortTitle: "아랍어 통번역",
    summary: "아랍어권 고객과 행정 절차 사이에서 문서·상담 내용을 정확히 정리합니다.",
    summaryEn: "We accurately bridge documents and consultations between Arabic-speaking clients and administrative procedures.",
    audience: ["아랍어 자료 번역이 필요한 분", "아랍어권 고객 응대가 필요한 기관·사업자"],
    audienceEn: ["Those needing Arabic document translation", "Agencies/businesses serving Arabic-speaking clients"],
    scope: ["문서 목적 확인", "번역 범위와 제출처 확인", "상담 내용 정리"],
    scopeEn: ["Confirming the document's purpose", "Confirming translation scope and recipient", "Organizing consultation content"],
    preparation: ["원문 파일 또는 이미지", "제출처와 사용 목적", "표기 기준이 필요한 이름·주소 정보"],
    preparationEn: ["Source files or images", "The recipient and intended use", "Names/addresses needing a spelling standard"],
    process: ["자료 수령", "용도 확인", "번역·검토 범위 정리", "후속 안내"],
    processEn: ["Receiving materials", "Confirming the use", "Organizing translation/review scope", "Follow-up guidance"],
    cautions: ["공증·인증 필요 여부는 제출처 기준을 확인해야 합니다.", "전문 용어는 문맥 확인이 필요합니다."],
    cautionsEn: ["Whether notarization/authentication is needed depends on the recipient.", "Technical terms require context confirmation."]
  },
  {
    slug: "civil-petition",
    practiceArea: "civil_petition",
    title: "기타 민원 및 행정 상담",
    titleEn: "Other Petitions & Administrative Consultation",
    shortTitle: "기타 민원",
    summary: "분야가 명확하지 않은 민원도 접수 후 적절한 절차와 준비 자료를 정리합니다.",
    summaryEn: "Even unclear petitions — after intake we organize the right procedure and materials.",
    audience: ["어느 기관에 문의해야 할지 모르는 분", "복합 민원 자료를 정리해야 하는 분"],
    audienceEn: ["Those unsure which agency to contact", "Those who must organize complex petition materials"],
    scope: ["민원 목적 확인", "관련 기관 후보 정리", "기초 자료 점검"],
    scopeEn: ["Confirming the petition's purpose", "Listing candidate agencies", "Checking basic materials"],
    preparation: ["민원 배경 설명", "기존 문의·답변 자료", "관련 사진·문서·통지서"],
    preparationEn: ["A description of the background", "Prior inquiries and responses", "Related photos, documents, and notices"],
    process: ["기초 상담 접수", "업무 분야 분류", "자료 보완 안내", "가능 절차 검토"],
    processEn: ["Intake of a basic consultation", "Classifying the practice area", "Guiding supplementary materials", "Reviewing feasible procedures"],
    cautions: ["관할 기관이 여러 곳일 수 있습니다.", "사안에 따라 다른 전문가 연결이 필요할 수 있습니다."],
    cautionsEn: ["There may be multiple competent agencies.", "Some matters may need referral to another specialist."]
  }
];

export function getPublicMarketingService(slug: string) {
  return PUBLIC_MARKETING_SERVICES.find((service) => service.slug === slug) ?? null;
}

/** 서비스 본문을 언어별로 뽑아낸다(EN 미지정 필드는 KO 폴백). */
export function localizeMarketingService(s: PublicMarketingService, lang: "ko" | "en") {
  const en = lang === "en";
  return {
    title: en ? s.titleEn || s.title : s.title,
    summary: en ? s.summaryEn || s.summary : s.summary,
    audience: en ? s.audienceEn : s.audience,
    scope: en ? s.scopeEn : s.scope,
    preparation: en ? s.preparationEn : s.preparation,
    process: en ? s.processEn : s.process,
    cautions: en ? s.cautionsEn : s.cautions,
    safeNotice: en ? PUBLIC_MARKETING_SAFE_NOTICE_EN : PUBLIC_MARKETING_SAFE_NOTICE
  };
}

export function buildServiceIntakeHref(service: Pick<PublicMarketingService, "practiceArea">) {
  const params = new URLSearchParams({
    source: "website",
    channel: "service_page",
    practice_area: service.practiceArea
  });

  return `/intake?${params.toString()}`;
}

export function buildWebsiteIntakeHref(channel = "homepage") {
  const params = new URLSearchParams({
    source: "website",
    channel
  });

  return `/intake?${params.toString()}`;
}
