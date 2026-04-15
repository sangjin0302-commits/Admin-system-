export const localeValues = ["ko", "en", "ar"] as const;
export type Locale = (typeof localeValues)[number];

export const formLocaleValues = ["ko", "en"] as const;
export const adminSortValues = ["latest", "urgency"] as const;
export type AdminSort = (typeof adminSortValues)[number];

export const inquiryTypeValues = [
  "FOREIGNER_VISA",
  "IMMIGRATION_STAY",
  "APOSTILLE_CONSULAR",
  "TRANSLATION_NOTARY",
  "GENERAL_ADMIN_CIVIL",
  "CORPORATE_REQUEST",
  "UNKNOWN"
] as const;
export type InquiryType = (typeof inquiryTypeValues)[number];

export const inquiryStatusValues = [
  "NEW",
  "PRE_DIAGNOSED",
  "CONSULTATION_REQUIRED",
  "QUOTE_DRAFTED",
  "QUOTE_PENDING",
  "ON_HOLD",
  "IN_REVIEW",
  "WAITING_CONSULTATION",
  "QUOTE_SENT",
  "WON",
  "CLOSED"
] as const;
export type InquiryStatus = (typeof inquiryStatusValues)[number];

export const urgencyValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type UrgencyLevel = (typeof urgencyValues)[number];

export const languageCodeValues = ["KO", "EN", "AR"] as const;
export type LanguageCode = (typeof languageCodeValues)[number];

export const clientTypeValues = ["INDIVIDUAL", "COMPANY"] as const;
export type ClientType = (typeof clientTypeValues)[number];

type LabeledMap<T extends string> = Record<T, Record<Locale, string>>;

export const inquiryTypeLabels: LabeledMap<InquiryType> = {
  FOREIGNER_VISA: {
    ko: "외국인 비자",
    en: "Foreigner Visa",
    ar: "Foreigner Visa"
  },
  IMMIGRATION_STAY: {
    ko: "출입국 / 체류",
    en: "Immigration / Stay",
    ar: "Immigration / Stay"
  },
  APOSTILLE_CONSULAR: {
    ko: "행정심판",
    en: "Administrative Appeal",
    ar: "Administrative Appeal"
  },
  TRANSLATION_NOTARY: {
    ko: "기타 행정 상담",
    en: "Other Administrative Consultation",
    ar: "Other Administrative Consultation"
  },
  GENERAL_ADMIN_CIVIL: {
    ko: "인허가",
    en: "Licenses / Permits",
    ar: "Licenses / Permits"
  },
  CORPORATE_REQUEST: {
    ko: "기업 / 법인 행정 지원",
    en: "Corporate Administrative Support",
    ar: "Corporate Administrative Support"
  },
  UNKNOWN: {
    ko: "분야 미정 / 추가 확인",
    en: "Needs Review",
    ar: "Needs Review"
  }
};

export const inquiryStatusLabels: LabeledMap<InquiryStatus> = {
  NEW: { ko: "신규", en: "New", ar: "New" },
  PRE_DIAGNOSED: { ko: "사전진단 완료", en: "Pre-diagnosed", ar: "Pre-diagnosed" },
  CONSULTATION_REQUIRED: { ko: "상담 필요", en: "Consultation Required", ar: "Consultation Required" },
  QUOTE_DRAFTED: { ko: "견적 초안 생성", en: "Quote Drafted", ar: "Quote Drafted" },
  QUOTE_PENDING: { ko: "견적 발송 대기", en: "Quote Pending", ar: "Quote Pending" },
  ON_HOLD: { ko: "진행 보류", en: "On Hold", ar: "On Hold" },
  IN_REVIEW: { ko: "검토중", en: "In Review", ar: "In Review" },
  WAITING_CONSULTATION: { ko: "상담대기", en: "Waiting", ar: "Waiting" },
  QUOTE_SENT: { ko: "견적발송", en: "Quote Sent", ar: "Quote Sent" },
  WON: { ko: "수임", en: "Won", ar: "Won" },
  CLOSED: { ko: "종결", en: "Closed", ar: "Closed" }
};

export const urgencyLabels: LabeledMap<UrgencyLevel> = {
  LOW: { ko: "낮음", en: "Low", ar: "Low" },
  MEDIUM: { ko: "보통", en: "Medium", ar: "Medium" },
  HIGH: { ko: "높음", en: "High", ar: "High" },
  CRITICAL: { ko: "매우 긴급", en: "Critical", ar: "Critical" }
};

export const clientTypeLabels: LabeledMap<ClientType> = {
  INDIVIDUAL: { ko: "개인", en: "Individual", ar: "Individual" },
  COMPANY: { ko: "기업", en: "Company", ar: "Company" }
};

export const languageCodeLabels: LabeledMap<LanguageCode> = {
  KO: { ko: "한국어", en: "Korean", ar: "Korean" },
  EN: { ko: "영어", en: "English", ar: "English" },
  AR: { ko: "아랍어", en: "Arabic", ar: "Arabic" }
};

export const adminSortLabels: Record<AdminSort, Record<Locale, string>> = {
  latest: { ko: "최신순", en: "Latest", ar: "Latest" },
  urgency: { ko: "긴급도순", en: "Urgency", ar: "Urgency" }
};

export function toLanguageCode(locale: Locale): LanguageCode {
  if (locale === "ko") return "KO";
  if (locale === "en") return "EN";
  return "AR";
}

export function toLocale(languageCode: LanguageCode): Locale {
  if (languageCode === "KO") return "ko";
  if (languageCode === "EN") return "en";
  return "ar";
}

export function getUrgencyRank(level: UrgencyLevel) {
  return {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  }[level];
}
