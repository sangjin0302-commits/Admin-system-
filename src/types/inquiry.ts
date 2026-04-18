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

export const inquiryStatusGroupValues = [
  "INTAKE",
  "CONSULTATION",
  "QUOTE",
  "REVIEW",
  "WON",
  "RISK"
] as const;
export type InquiryStatusGroup = (typeof inquiryStatusGroupValues)[number];

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

export const inquiryStatusGroupLabels: LabeledMap<InquiryStatusGroup> = {
  INTAKE: { ko: "초기 분류", en: "Intake", ar: "الفرز الأولي" },
  CONSULTATION: { ko: "상담 연결", en: "Consultation", ar: "مسار الاستشارة" },
  QUOTE: { ko: "견적 진행", en: "Quote", ar: "مسار عرض السعر" },
  REVIEW: { ko: "검토·보류", en: "Review / Hold", ar: "المراجعة / التعليق" },
  WON: { ko: "수임", en: "Won", ar: "تم التعاقد" },
  RISK: { ko: "리스크 우선", en: "Risk Focus", ar: "مخاطر أولوية" }
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

function isValueInArray<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

export function normalizeInquiryType(value: unknown): InquiryType {
  return isValueInArray(value, inquiryTypeValues) ? value : "UNKNOWN";
}

export function normalizeInquiryStatus(value: unknown): InquiryStatus {
  return isValueInArray(value, inquiryStatusValues) ? value : "NEW";
}

export function normalizeInquiryStatusGroup(value: unknown): InquiryStatusGroup {
  return isValueInArray(value, inquiryStatusGroupValues) ? value : "INTAKE";
}

export function normalizeUrgencyLevel(value: unknown): UrgencyLevel {
  return isValueInArray(value, urgencyValues) ? value : "MEDIUM";
}

export function normalizeLanguageCode(value: unknown): LanguageCode {
  return isValueInArray(value, languageCodeValues) ? value : "KO";
}

export function normalizeClientType(value: unknown): ClientType {
  return isValueInArray(value, clientTypeValues) ? value : "INDIVIDUAL";
}

export function getInquiryTypeLabel(value: unknown, locale: Locale = "ko") {
  return inquiryTypeLabels[normalizeInquiryType(value)][locale];
}

export function getInquiryStatusLabel(value: unknown, locale: Locale = "ko") {
  return inquiryStatusLabels[normalizeInquiryStatus(value)][locale];
}

export function getInquiryStatusGroupLabel(value: unknown, locale: Locale = "ko") {
  return inquiryStatusGroupLabels[normalizeInquiryStatusGroup(value)][locale];
}

export function getUrgencyLabel(value: unknown, locale: Locale = "ko") {
  return urgencyLabels[normalizeUrgencyLevel(value)][locale];
}

export function getLanguageCodeLabel(value: unknown, locale: Locale = "ko") {
  return languageCodeLabels[normalizeLanguageCode(value)][locale];
}

export function getClientTypeLabel(value: unknown, locale: Locale = "ko") {
  return clientTypeLabels[normalizeClientType(value)][locale];
}

export function getInquiryStatusGroupStatuses(group: InquiryStatusGroup): InquiryStatus[] {
  if (group === "INTAKE") return ["NEW", "PRE_DIAGNOSED"];
  if (group === "CONSULTATION") return ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"];
  if (group === "QUOTE") return ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"];
  if (group === "REVIEW") return ["IN_REVIEW", "ON_HOLD"];
  if (group === "WON") return ["WON"];
  return ["ON_HOLD", "IN_REVIEW", "QUOTE_PENDING", "CONSULTATION_REQUIRED"];
}
