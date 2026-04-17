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
    ar: "تأشيرة الأجانب"
  },
  IMMIGRATION_STAY: {
    ko: "출입국·체류",
    en: "Immigration / Stay",
    ar: "الهجرة والإقامة"
  },
  APOSTILLE_CONSULAR: {
    ko: "아포스티유·영사확인",
    en: "Apostille / Consular",
    ar: "الأبوستيل / التصديق القنصلي"
  },
  TRANSLATION_NOTARY: {
    ko: "번역·공증",
    en: "Translation / Notary",
    ar: "الترجمة / التوثيق"
  },
  GENERAL_ADMIN_CIVIL: {
    ko: "일반 행정민원",
    en: "General Administrative Service",
    ar: "الخدمات الإدارية العامة"
  },
  CORPORATE_REQUEST: {
    ko: "기업 의뢰",
    en: "Corporate Request",
    ar: "طلبات الشركات"
  },
  UNKNOWN: {
    ko: "기타·추가 확인",
    en: "Needs Review",
    ar: "يحتاج إلى مراجعة"
  }
};

export const inquiryStatusLabels: LabeledMap<InquiryStatus> = {
  NEW: { ko: "신규", en: "New", ar: "جديد" },
  PRE_DIAGNOSED: { ko: "사전진단 완료", en: "Pre-diagnosed", ar: "تم التشخيص الأولي" },
  CONSULTATION_REQUIRED: { ko: "상담 필요", en: "Consultation Required", ar: "تحتاج إلى استشارة" },
  QUOTE_DRAFTED: { ko: "견적 초안 생성", en: "Quote Drafted", ar: "تم إعداد عرض السعر" },
  QUOTE_PENDING: { ko: "견적 발송 대기", en: "Quote Pending", ar: "بانتظار إرسال العرض" },
  ON_HOLD: { ko: "진행 보류", en: "On Hold", ar: "معلق" },
  IN_REVIEW: { ko: "검토 중", en: "In Review", ar: "قيد المراجعة" },
  WAITING_CONSULTATION: { ko: "상담 대기", en: "Waiting Consultation", ar: "بانتظار الاستشارة" },
  QUOTE_SENT: { ko: "견적 발송", en: "Quote Sent", ar: "تم إرسال العرض" },
  WON: { ko: "수임", en: "Won", ar: "تم التعاقد" },
  CLOSED: { ko: "종결", en: "Closed", ar: "مغلق" }
};

export const urgencyLabels: LabeledMap<UrgencyLevel> = {
  LOW: { ko: "낮음", en: "Low", ar: "منخفض" },
  MEDIUM: { ko: "보통", en: "Medium", ar: "متوسط" },
  HIGH: { ko: "높음", en: "High", ar: "مرتفع" },
  CRITICAL: { ko: "매우 긴급", en: "Critical", ar: "عاجل جدًا" }
};

export const clientTypeLabels: LabeledMap<ClientType> = {
  INDIVIDUAL: { ko: "개인", en: "Individual", ar: "فرد" },
  COMPANY: { ko: "기업", en: "Company", ar: "شركة" }
};

export const languageCodeLabels: LabeledMap<LanguageCode> = {
  KO: { ko: "한국어", en: "Korean", ar: "الكورية" },
  EN: { ko: "영어", en: "English", ar: "الإنجليزية" },
  AR: { ko: "아랍어", en: "Arabic", ar: "العربية" }
};

export const adminSortLabels: Record<AdminSort, Record<Locale, string>> = {
  latest: { ko: "최신순", en: "Latest", ar: "الأحدث" },
  urgency: { ko: "긴급도순", en: "Urgency", ar: "الأولوية" }
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
