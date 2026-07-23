import type { InquiryType, Locale } from "@/types/inquiry";

type LocaleTemplate = {
  subject: (typeLabel: string) => string;
  sections: {
    thanks: string;
    classification: string;
    documents: string;
    nextStep: string;
    caution: string;
  };
  lines: {
    thanks: (name: string, inquiryId: string) => string;
    classification: (typeLabel: string) => string;
    nextStep: (nextStep: string) => string;
    caution: (caution: string) => string;
  };
};

export const commonRecommendedDocuments: Record<Locale, string[]> = {
  ko: [
    "신청인 인적사항 또는 회사 기본정보",
    "신분증 또는 여권 사본",
    "보유 중인 관련 서류 사본",
    "제출처 및 사용 목적 정보"
  ],
  en: [
    "Applicant or company basic information",
    "Passport or ID copy",
    "Copies of relevant existing documents",
    "Target authority and intended purpose"
  ]
};

export const inquiryTypeDocuments: Record<InquiryType, Record<Locale, string[]>> = {
  FOREIGNER_VISA: {
    ko: ["현재 체류자격 정보", "외국인등록증 사본", "초청/고용 관련 서류", "학력 또는 경력 입증자료"],
    en: ["Current visa status", "ARC copy", "Invitation or employment documents", "Education or career proof"]
  },
  IMMIGRATION_STAY: {
    ko: ["체류만료일 정보", "출입국 관련 이력", "기존 신고 또는 허가 자료", "연장/변경 사유 자료"],
    en: ["Stay expiry information", "Immigration history", "Existing filing or permit materials", "Reason for extension or change"]
  },
  APOSTILLE_CONSULAR: {
    ko: ["원본 문서 목록", "문서 발행 국가", "한국 내 제출기관 정보", "공증 여부"],
    en: ["Original document list", "Issuing country", "Target Korean authority", "Notarization status"]
  },
  TRANSLATION_NOTARY: {
    ko: ["원문 파일", "번역 언어 방향", "공증 필요 여부", "페이지 수 또는 분량"],
    en: ["Source file", "Translation direction", "Whether notarization is required", "Page count or volume"]
  },
  GENERAL_ADMIN_CIVIL: {
    ko: ["대상 기관 정보", "민원 목적", "기존 반려/보완 이력", "관련 인허가 문서"],
    en: ["Target authority information", "Purpose of the request", "Any rejection or supplement history", "Related permit documents"]
  },
  CORPORATE_REQUEST: {
    ko: ["회사 기본정보", "담당자 정보", "요청 범위", "국가별 일정", "예상 건수"],
    en: ["Company profile", "Primary contact details", "Scope of request", "Country-by-country timeline", "Estimated volume"]
  },
  UNKNOWN: {
    ko: ["상세 문의 설명", "관련 문서", "희망 처리 방향"],
    en: ["Detailed request description", "Related documents", "Preferred handling direction"]
  }
};

export const inquiryTypeCautions: Record<InquiryType, Record<Locale, string>> = {
  FOREIGNER_VISA: {
    ko: "실제 가능 여부는 체류자격, 고용 형태, 제출처 기준에 따라 달라질 수 있습니다.",
    en: "Eligibility may vary depending on visa status, employment structure, and filing authority."
  },
  IMMIGRATION_STAY: {
    ko: "체류 만료일이 임박한 경우 일반 안내보다 빠른 검토가 필요할 수 있습니다.",
    en: "Cases close to the stay expiry date may require priority review."
  },
  APOSTILLE_CONSULAR: {
    ko: "국가와 제출처에 따라 아포스티유 대신 영사확인이 필요할 수 있습니다.",
    en: "Depending on the country and target authority, consular legalization may be required instead of apostille."
  },
  TRANSLATION_NOTARY: {
    ko: "번역본 사용처에 따라 공증 또는 인증 번역 형식이 달라질 수 있습니다.",
    en: "The required translation or notarization format may vary by destination authority."
  },
  GENERAL_ADMIN_CIVIL: {
    ko: "기관별 요구 양식이 다를 수 있으므로 제출처 확인이 중요합니다.",
    en: "Required forms may differ by agency, so the target authority should be confirmed."
  },
  CORPORATE_REQUEST: {
    ko: "기업 건은 범위와 일정이 확정되어야 견적 및 처리 방식이 명확해집니다.",
    en: "For corporate matters, scope and timing should be clarified before final quotation and workflow."
  },
  UNKNOWN: {
    ko: "현재 정보만으로는 정확한 분류가 어려워 추가 확인이 필요합니다.",
    en: "The current information is not sufficient for precise classification, so further review is required."
  }
};

export const localeTemplates: Record<Locale, LocaleTemplate> = {
  ko: {
    subject: (typeLabel) => `[행정사 상담접수] ${typeLabel} 문의가 접수되었습니다`,
    sections: {
      thanks: "접수 감사",
      classification: "분류된 문의 유형",
      documents: "준비 권장 서류",
      nextStep: "다음 단계",
      caution: "유의사항"
    },
    lines: {
      thanks: (name, inquiryId) =>
        `${name}님, 문의를 접수해 주셔서 감사합니다. 접수번호는 ${inquiryId}입니다.`,
      classification: (typeLabel) => `현재 문의는 "${typeLabel}" 유형으로 우선 분류되었습니다.`,
      nextStep: (nextStep) => `관리자 검토 후 ${nextStep}`,
      caution: (caution) => caution
    }
  },
  en: {
    subject: (typeLabel) => `[Administrative Office] ${typeLabel} inquiry received`,
    sections: {
      thanks: "Thank You",
      classification: "Classified Inquiry Type",
      documents: "Recommended Documents",
      nextStep: "Next Step",
      caution: "Important Note"
    },
    lines: {
      thanks: (name, inquiryId) =>
        `Thank you, ${name}. Your inquiry has been received. Your reference number is ${inquiryId}.`,
      classification: (typeLabel) => `Your matter has been provisionally classified as "${typeLabel}".`,
      nextStep: (nextStep) => `After admin review, we will proceed as follows: ${nextStep}`,
      caution: (caution) => caution
    }
  }
};
