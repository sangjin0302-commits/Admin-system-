import {
  inquiryTypeLabels,
  urgencyLabels,
  type InquiryType,
  type LanguageCode,
  type Locale,
  toLocale
} from "@/types/inquiry";

type GuidanceInput = {
  inquiryType: InquiryType;
  locale: Locale;
  urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate?: Date;
};

const COMMON_DOCS: Record<Locale, string[]> = {
  ko: [
    "신청인 기본 인적사항",
    "신분증 또는 여권 사본",
    "관련 문서 스캔본 또는 사진",
    "제출처 및 사용 목적",
    "희망 일정 또는 마감일"
  ],
  en: [
    "Applicant basic information",
    "Passport or ID copy",
    "Scans or photos of related documents",
    "Target authority and purpose",
    "Preferred schedule or deadline"
  ]
};

const TYPE_DOCS: Record<InquiryType, Record<Locale, string[]>> = {
  FOREIGNER_VISA: {
    ko: ["현재 체류자격 정보", "외국인등록증 사본", "고용 또는 초청 관련 서류", "학력/경력 입증자료"],
    en: ["Current visa status", "ARC copy", "Employment or invitation documents", "Education or career proof"]
  },
  IMMIGRATION_STAY: {
    ko: ["체류만료일", "최근 출입국 이력", "체류지 신고 관련 자료", "변경 또는 연장 사유 자료"],
    en: ["Stay expiry date", "Recent immigration history", "Address reporting materials", "Reason for change or extension"]
  },
  APOSTILLE_CONSULAR: {
    ko: ["원본 문서 발행국 정보", "원본 또는 공증본 여부", "한국 제출기관 정보", "영사확인 필요 여부"],
    en: ["Issuing country of the original document", "Whether you have originals or notarized copies", "Target Korean authority", "Whether consular legalization may be required"]
  },
  TRANSLATION_NOTARY: {
    ko: ["원문 파일", "번역 언어 방향", "공증 필요 여부", "페이지 수 또는 분량"],
    en: ["Source document file", "Translation language direction", "Whether notarization is required", "Page count or volume"]
  },
  GENERAL_ADMIN_CIVIL: {
    ko: ["신청 대상 기관", "민원 목적", "보유 중인 관련 허가/신고 문서", "기존 반려 또는 보완 이력"],
    en: ["Target authority", "Purpose of the request", "Existing permits or filings", "Any rejection or supplement history"]
  },
  CORPORATE_REQUEST: {
    ko: ["회사 기본정보", "담당자 정보", "프로젝트 범위", "국가별 제출 일정", "예상 건수"],
    en: ["Company profile", "Contact person information", "Project scope", "Country-by-country filing schedule", "Expected case volume"]
  },
  UNKNOWN: {
    ko: ["상세 문의 내용", "관련 문서", "희망 처리 방향"],
    en: ["Detailed request description", "Related documents", "Preferred handling direction"]
  }
};

export function generatePreparationGuidance(input: GuidanceInput) {
  const headline =
    input.locale === "ko" ? "기본 준비서류 안내" : "Initial document checklist";
  const urgencyText = urgencyLabels[input.urgencyLevel][input.locale];
  const dueDateText = input.dueDate
    ? new Intl.DateTimeFormat(input.locale === "ko" ? "ko-KR" : "en-US", {
        dateStyle: "medium"
      }).format(input.dueDate)
    : input.locale === "ko"
      ? "미입력"
      : "Not provided";

  const lines = [
    headline,
    input.locale === "ko"
      ? `유형: ${inquiryTypeLabels[input.inquiryType][input.locale]}`
      : `Type: ${inquiryTypeLabels[input.inquiryType][input.locale]}`,
    input.locale === "ko" ? `긴급도: ${urgencyText}` : `Urgency: ${urgencyText}`,
    input.locale === "ko" ? `희망 일정: ${dueDateText}` : `Target date: ${dueDateText}`,
    "",
    ...(input.locale === "ko" ? ["공통 준비사항"] : ["Common items"]),
    ...COMMON_DOCS[input.locale].map((item, index) => `${index + 1}. ${item}`),
    "",
    ...(input.locale === "ko" ? ["유형별 추가사항"] : ["Type-specific items"]),
    ...TYPE_DOCS[input.inquiryType][input.locale].map((item, index) => `${index + 1}. ${item}`)
  ];

  return lines.join("\n");
}

type ReceiptInput = {
  inquiryId: string;
  inquiryType: InquiryType;
  urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  preferredLanguage: LanguageCode;
  contactName: string;
};

export function generateReceiptMessage(input: ReceiptInput) {
  const locale = toLocale(input.preferredLanguage);
  const typeLabel = inquiryTypeLabels[input.inquiryType][locale];
  const urgencyText = urgencyLabels[input.urgencyLevel][locale];

  if (locale === "ko") {
    return `${input.contactName}님, 접수가 완료되었습니다. 현재 문의는 "${typeLabel}" 유형으로 분류되었고 긴급도는 ${urgencyText}입니다. 관리자 검토 후 상담 가능 여부와 다음 절차를 안내드리겠습니다. 접수번호: ${input.inquiryId}`;
  }

  return `Thank you, ${input.contactName}. Your inquiry has been received and classified as "${typeLabel}" with ${urgencyText.toLowerCase()} urgency. We will review the case and follow up with the next steps. Reference number: ${input.inquiryId}`;
}

type SummaryInput = {
  inquiryType: InquiryType;
  preferredLanguage: LanguageCode;
  title: string;
  description: string;
  urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  qualificationScore: number;
};

export function generateInquirySummary(input: SummaryInput) {
  const locale = toLocale(input.preferredLanguage);
  const clippedDescription =
    input.description.length > 140 ? `${input.description.slice(0, 140)}...` : input.description;

  if (locale === "ko") {
    return `${inquiryTypeLabels[input.inquiryType][locale]} 문의입니다. 제목은 "${input.title}"이며, 긴급도는 ${urgencyLabels[input.urgencyLevel][locale]}, 수임 적합도는 ${input.qualificationScore}점입니다. 핵심 내용: ${clippedDescription}`;
  }

  return `${inquiryTypeLabels[input.inquiryType][locale]} inquiry. Title: "${input.title}". Urgency: ${urgencyLabels[input.urgencyLevel][locale]}. Qualification score: ${input.qualificationScore}. Summary: ${clippedDescription}`;
}
