import type { Locale } from "@/types/inquiry";

type IntakePageKey =
  | "switchToEnglish"
  | "switchToKorean"
  | "switchToArabic"
  | "heroKicker"
  | "heroTitle"
  | "heroDescription"
  | "prepTitle"
  | "prepDescription"
  | "prepItemCurrentStatus"
  | "prepItemGoalAndDeadline"
  | "prepItemAvailableDocuments"
  | "prepItemTargetAgency"
  | "formTitle"
  | "formDescription";

export type IntakeLocaleMessages = Record<Locale, Record<IntakePageKey, string>>;

export const intakePageMessages: IntakeLocaleMessages = {
  ko: {
    switchToEnglish: "English",
    switchToKorean: "한국어",
    switchToArabic: "العربية",
    heroKicker: "온라인 접수",
    heroTitle: "행정업무 상담을 빠르게 접수하세요",
    heroDescription:
      "필수 정보를 먼저 입력하면 접수 후 검토 단계와 다음 안내를 한 번에 확인할 수 있습니다.",
    prepTitle: "준비 정보",
    prepDescription: "아래 항목을 준비하면 초기 검토와 상담 안내가 더 정확해집니다.",
    prepItemCurrentStatus: "현재 상황: 체류/처분/진행 상태를 간단히 정리",
    prepItemGoalAndDeadline: "원하는 결과와 목표 일정 또는 마감일",
    prepItemAvailableDocuments: "보유 문서 여부(원본/번역 필요 여부 포함)",
    prepItemTargetAgency: "제출 예정 기관 또는 사용처 정보",
    formTitle: "접수 입력 정보",
    formDescription: "필수 항목부터 입력하고, 필요 시 선택 정보를 추가해 주세요."
  },
  en: {
    switchToEnglish: "English",
    switchToKorean: "Korean",
    switchToArabic: "العربية",
    heroKicker: "Online intake",
    heroTitle: "Submit your administrative inquiry quickly",
    heroDescription:
      "Start with required information and receive clear next-step guidance after submission.",
    prepTitle: "Preparation Info",
    prepDescription: "Including the items below helps us triage your case faster and more accurately.",
    prepItemCurrentStatus: "Current status: visa, sanction, or progress summary",
    prepItemGoalAndDeadline: "Desired outcome and target date or deadline",
    prepItemAvailableDocuments: "Available documents and translation needs",
    prepItemTargetAgency: "Target authority or destination",
    formTitle: "Intake Input Info",
    formDescription: "Complete required fields first, then add optional details if helpful."
  },
  ar: {
    switchToEnglish: "English",
    switchToKorean: "한국어",
    switchToArabic: "العربية",
    heroKicker: "التقديم عبر الإنترنت",
    heroTitle: "قدّم استفسارك الإداري بسرعة",
    heroDescription:
      "ابدأ بالمعلومات المطلوبة واحصل على إرشادات واضحة للخطوات التالية بعد التقديم.",
    prepTitle: "معلومات التحضير",
    prepDescription: "تضمين العناصر أدناه يساعدنا في فرز حالتك بشكل أسرع وأكثر دقة.",
    prepItemCurrentStatus: "الوضع الحالي: ملخص التأشيرة أو القرار أو التقدم",
    prepItemGoalAndDeadline: "النتيجة المرجوة والتاريخ المستهدف أو الموعد النهائي",
    prepItemAvailableDocuments: "المستندات المتوفرة واحتياجات الترجمة",
    prepItemTargetAgency: "الجهة المستهدفة أو الوجهة",
    formTitle: "معلومات نموذج التقديم",
    formDescription: "أكمل الحقول المطلوبة أولاً، ثم أضف التفاصيل الاختيارية إن لزم الأمر."
  }
};
