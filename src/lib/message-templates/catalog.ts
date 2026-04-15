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
    "의뢰인 인적사항 또는 회사 기본정보",
    "신분증 또는 여권 사본",
    "보유 중인 관련 서류 사본",
    "제출처 및 사용 목적 정보"
  ],
  en: [
    "Applicant or company basic information",
    "Passport or ID copy",
    "Copies of relevant existing documents",
    "Target authority and intended purpose"
  ],
  ar: [
    "[Arabic placeholder] Applicant or company basic information",
    "[Arabic placeholder] Passport or ID copy",
    "[Arabic placeholder] Relevant documents",
    "[Arabic placeholder] Target authority and purpose"
  ]
};

export const inquiryTypeDocuments: Record<InquiryType, Record<Locale, string[]>> = {
  FOREIGNER_VISA: {
    ko: ["현재 체류자격 정보", "외국인등록증 사본", "초청 또는 고용 관련 서류", "학력 또는 경력 입증자료"],
    en: ["Current visa status", "ARC copy", "Invitation or employment documents", "Education or career proof"],
    ar: ["[Arabic placeholder] Current visa status", "[Arabic placeholder] ARC copy", "[Arabic placeholder] Invitation or employment documents", "[Arabic placeholder] Education or career proof"]
  },
  IMMIGRATION_STAY: {
    ko: ["체류 만료일 정보", "출입국 관련 이력", "기존 신고 또는 허가 자료", "연장 또는 변경 사유 자료"],
    en: ["Stay expiry information", "Immigration history", "Existing filing or permit materials", "Reason for extension or change"],
    ar: ["[Arabic placeholder] Stay expiry information", "[Arabic placeholder] Immigration history", "[Arabic placeholder] Existing filing materials", "[Arabic placeholder] Reason for extension or change"]
  },
  APOSTILLE_CONSULAR: {
    ko: ["처분서 또는 통지서", "이의신청 또는 불복 경과", "관련 증빙자료", "원하는 구제 결과 정리"],
    en: ["Administrative decision or notice", "Prior objection or appeal history", "Supporting evidence", "Desired remedy summary"],
    ar: ["[Arabic placeholder] Administrative decision or notice", "[Arabic placeholder] Appeal history", "[Arabic placeholder] Supporting evidence", "[Arabic placeholder] Desired remedy summary"]
  },
  TRANSLATION_NOTARY: {
    ko: ["현재 상황 설명", "관련 기관 또는 상대방 정보", "보유 중인 자료 목록", "원하는 처리 방향"],
    en: ["Current situation summary", "Relevant authority or counterparty", "Available materials", "Preferred handling direction"],
    ar: ["[Arabic placeholder] Current situation summary", "[Arabic placeholder] Relevant authority", "[Arabic placeholder] Available materials", "[Arabic placeholder] Preferred handling direction"]
  },
  GENERAL_ADMIN_CIVIL: {
    ko: ["대상 기관 정보", "허가 또는 신고 목적", "기존 반려 또는 보완 이력", "관련 등록 또는 입증 문서"],
    en: ["Target authority information", "Purpose of the permit or filing", "Any rejection or supplement history", "Relevant registration or proof documents"],
    ar: ["[Arabic placeholder] Target authority information", "[Arabic placeholder] Permit or filing purpose", "[Arabic placeholder] Rejection history", "[Arabic placeholder] Relevant documents"]
  },
  CORPORATE_REQUEST: {
    ko: ["회사 기본정보", "담당자 정보", "요청 범위", "국가별 또는 기관별 일정", "예상 건수"],
    en: ["Company profile", "Primary contact details", "Scope of request", "Country-by-country or authority timeline", "Estimated volume"],
    ar: ["[Arabic placeholder] Company profile", "[Arabic placeholder] Contact details", "[Arabic placeholder] Scope", "[Arabic placeholder] Timeline", "[Arabic placeholder] Volume"]
  },
  UNKNOWN: {
    ko: ["상세 문의 설명", "관련 문서", "희망 처리 방향"],
    en: ["Detailed request description", "Related documents", "Preferred handling direction"],
    ar: ["[Arabic placeholder] Detailed request description", "[Arabic placeholder] Related documents", "[Arabic placeholder] Preferred handling direction"]
  }
};

export const inquiryTypeCautions: Record<InquiryType, Record<Locale, string>> = {
  FOREIGNER_VISA: {
    ko: "실제 가능 여부는 현재 체류자격, 고용 형태, 제출처 기준에 따라 달라질 수 있습니다.",
    en: "Eligibility may vary depending on visa status, employment structure, and filing authority.",
    ar: "[Arabic placeholder] Eligibility may vary depending on visa status and filing authority."
  },
  IMMIGRATION_STAY: {
    ko: "체류 만료일이 임박한 경우 일반 안내보다 빠른 검토가 필요할 수 있습니다.",
    en: "Cases close to the stay expiry date may require priority review.",
    ar: "[Arabic placeholder] Cases near expiry may require priority review."
  },
  APOSTILLE_CONSULAR: {
    ko: "행정심판은 처분 경위와 불복 기간 확인이 중요하므로 관련 통지서와 일정 정보를 먼저 확인해야 합니다.",
    en: "Administrative appeals require careful review of the decision timeline and the filing window.",
    ar: "[Arabic placeholder] Administrative appeals require review of the decision timeline."
  },
  TRANSLATION_NOTARY: {
    ko: "기타 행정 상담은 실제 처리 가능 범위를 확인한 뒤 직접 진행 또는 별도 안내 여부를 결정합니다.",
    en: "Other administrative consultations are reviewed first to confirm whether they can be handled directly or require separate guidance.",
    ar: "[Arabic placeholder] Other administrative consultations are reviewed first."
  },
  GENERAL_ADMIN_CIVIL: {
    ko: "인허가와 신고는 기관별 요구 서식이 달라 제출처 확인이 중요합니다.",
    en: "Licenses and permits may require different forms depending on the target authority.",
    ar: "[Arabic placeholder] Licenses and permits may differ by authority."
  },
  CORPORATE_REQUEST: {
    ko: "기업 또는 법인 의뢰는 범위와 일정이 먼저 정리되어야 견적과 처리 방식이 명확해집니다.",
    en: "For corporate matters, scope and timing should be clarified before final quotation and workflow.",
    ar: "[Arabic placeholder] Scope and timing should be clarified before final quotation."
  },
  UNKNOWN: {
    ko: "현재 정보만으로는 정확한 분야 분류가 어려워 추가 확인이 필요합니다.",
    en: "The current information is not sufficient for precise classification, so further review is required.",
    ar: "[Arabic placeholder] Further review is required for precise classification."
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
      caution: "주의사항"
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
  },
  ar: {
    subject: () => "[Arabic placeholder] Inquiry received",
    sections: {
      thanks: "Arabic Placeholder",
      classification: "Arabic Placeholder",
      documents: "Arabic Placeholder",
      nextStep: "Arabic Placeholder",
      caution: "Arabic Placeholder"
    },
    lines: {
      thanks: (_name, inquiryId) =>
        `[Arabic placeholder] Your inquiry has been received. Reference: ${inquiryId}.`,
      classification: (typeLabel) =>
        `[Arabic placeholder] Classified inquiry type: ${typeLabel}.`,
      nextStep: (nextStep) => `[Arabic placeholder] Next step: ${nextStep}`,
      caution: (caution) => caution
    }
  }
};
