import type { Locale } from "@/types/inquiry";

const copy = {
  ko: {
    pageKicker: "행정사 사무소 상담 접수",
    pageTitle: "실제 운영을 위한 초기 상담 접수",
    pageDescription:
      "문의 내용을 접수하면 유형 분류, 긴급도 판정, 기본 안내 메시지가 자동으로 생성됩니다. 접수 후에는 관리자 검토를 거쳐 상담 여부와 다음 절차를 안내합니다.",
    infoTitle: "안내",
    infoItems: [
      "외국인 비자, 출입국/체류, 아포스티유/영사확인, 번역/공증, 일반 행정민원, 기업 의뢰를 접수할 수 있습니다.",
      "긴급도와 유형은 자동 분류되지만, 실제 진행 가능 여부는 관리자 검토 후 확정됩니다.",
      "영어 응대가 필요한 경우 영어로 작성해도 됩니다."
    ],
    formTitle: "상담 접수 작성",
    resultTitle: "자동 생성 결과",
    resultDescription: "접수 직후 생성되는 초안입니다. 관리자 검토 후 실제 안내에 반영됩니다.",
    labels: {
      preferredLocale: "응대 언어",
      clientType: "의뢰 형태",
      contactName: "이름",
      organizationName: "회사명",
      email: "이메일",
      phone: "전화번호",
      title: "문의 제목",
      requestedInquiryType: "문의 유형(선택)",
      description: "상세 내용",
      requestedOutcome: "원하는 결과",
      declaredUrgency: "체감 긴급도",
      nationality: "국적",
      currentStatus: "현재 체류/진행 상태",
      documentCountry: "문서 발행 국가",
      targetAgency: "제출처 또는 사용처",
      dueDate: "희망 일정 또는 마감일",
      isCorporateRequest: "기업 의뢰 여부",
      needsTranslation: "번역 필요 여부",
      hasPreparedDocuments: "보유 서류 여부",
      wantsCallback: "전화 상담 희망",
      consentToPrivacy: "개인정보 수집 및 상담 목적 이용에 동의합니다."
    },
    placeholders: {
      contactName: "예: 홍길동",
      organizationName: "예: ABC Global Co.",
      email: "example@email.com",
      phone: "010-0000-0000",
      title: "예: E-7 체류자격 변경 가능 여부 문의",
      description: "현재 상황, 원하는 결과, 마감일, 보유 중인 서류, 제출처를 적어주세요.",
      requestedOutcome: "예: 2주 내 체류자격 변경 접수 완료",
      nationality: "예: 미국, 인도, 우즈베키스탄",
      currentStatus: "예: D-10 체류 중 / 원본 문서 보유 / 번역본 필요",
      documentCountry: "예: 미국, UAE",
      targetAgency: "예: 출입국사무소, 은행, 학교"
    },
    buttons: {
      submit: "접수하기",
      submitting: "접수 중...",
      resetResult: "결과 닫기"
    },
    clientTypeOptions: {
      INDIVIDUAL: "개인",
      COMPANY: "기업"
    },
    callbackHelp: "긴급하거나 설명이 복잡한 건은 관리자 검토 후 우선 연락 대상으로 표시됩니다.",
    optionLabels: {
      corporateYes: "기업 의뢰입니다",
      translationYes: "번역이 필요합니다",
      documentsReady: "기초 서류를 이미 보유하고 있습니다"
    },
    adminLink: "관리자 화면",
    emptyResult: "접수 후 이 영역에서 자동 분류, 긴급도, 기본 안내 메시지를 확인할 수 있습니다.",
    errorGeneric: "접수 처리 중 오류가 발생했습니다. 입력값을 다시 확인해 주세요."
  },
  en: {
    pageKicker: "Administrative Office Intake",
    pageTitle: "Initial consultation intake for real office operations",
    pageDescription:
      "Once the inquiry is submitted, the app generates an initial category, urgency score, and client-facing guidance draft. Final handling is confirmed after admin review.",
    infoTitle: "Notes",
    infoItems: [
      "You can submit visa, immigration, apostille, translation, civil administrative, and corporate matters.",
      "The category and urgency are generated automatically, but final feasibility is confirmed after review.",
      "You may write in English if you prefer English communication."
    ],
    formTitle: "Submit an Inquiry",
    resultTitle: "Generated Draft",
    resultDescription: "This draft is created immediately after submission and is subject to admin review.",
    labels: {
      preferredLocale: "Response language",
      clientType: "Client type",
      contactName: "Name",
      organizationName: "Company",
      email: "Email",
      phone: "Phone",
      title: "Subject",
      requestedInquiryType: "Inquiry type (optional)",
      description: "Details",
      requestedOutcome: "Desired outcome",
      declaredUrgency: "Declared urgency",
      nationality: "Nationality",
      currentStatus: "Current visa or progress status",
      documentCountry: "Document issuing country",
      targetAgency: "Target authority or destination",
      dueDate: "Preferred date or deadline",
      isCorporateRequest: "Corporate request",
      needsTranslation: "Translation required",
      hasPreparedDocuments: "Documents currently available",
      wantsCallback: "Request phone consultation",
      consentToPrivacy: "I agree to the collection and use of personal information for consultation."
    },
    placeholders: {
      contactName: "Example: Jane Smith",
      organizationName: "Example: ABC Global Co.",
      email: "example@email.com",
      phone: "+82-10-0000-0000",
      title: "Example: Eligibility for E-7 visa change",
      description: "Please describe your situation, desired outcome, deadline, available documents, and target authority.",
      requestedOutcome: "Example: File visa change within 2 weeks",
      nationality: "Example: United States, India, Uzbekistan",
      currentStatus: "Example: On D-10 / original documents available / translation needed",
      documentCountry: "Example: United States, UAE",
      targetAgency: "Example: Immigration office, bank, school"
    },
    buttons: {
      submit: "Submit Inquiry",
      submitting: "Submitting...",
      resetResult: "Close Result"
    },
    clientTypeOptions: {
      INDIVIDUAL: "Individual",
      COMPANY: "Company"
    },
    callbackHelp: "Urgent or complex cases can be marked for priority phone follow-up after admin review.",
    optionLabels: {
      corporateYes: "This is a corporate request",
      translationYes: "Translation is required",
      documentsReady: "I already have base documents"
    },
    adminLink: "Admin Dashboard",
    emptyResult: "After submission, this panel will show the generated category, urgency, and client guidance.",
    errorGeneric: "There was an error while submitting. Please review the form."
  },
  ar: {
    pageKicker: "مكتب الخدمات الإدارية",
    pageTitle: "نموذج الاستشارة",
    pageDescription:
      "بمجرد إرسال الاستفسار، يتم إنشاء تصنيف أولي ودرجة استعجال ومسودة إرشادات تلقائيًا. يتم تأكيد الإجراء النهائي بعد مراجعة المسؤول.",
    infoTitle: "ملاحظات",
    infoItems: [
      "يمكنك تقديم استفسارات حول التأشيرات، الهجرة، التصديق، الترجمة، الشؤون الإدارية المدنية، وطلبات الشركات.",
      "يتم تصنيف الفئة والاستعجال تلقائيًا، لكن الجدوى النهائية تُؤكد بعد المراجعة.",
      "يمكنك الكتابة باللغة العربية أو الإنجليزية."
    ],
    formTitle: "طلب مراجعة مجانية",
    resultTitle: "المسودة المُنشأة",
    resultDescription: "يتم إنشاء هذه المسودة فور الإرسال وتخضع لمراجعة المسؤول.",
    labels: {
      preferredLocale: "لغة الرد",
      clientType: "نوع العميل",
      contactName: "الاسم",
      organizationName: "اسم الشركة",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف",
      title: "عنوان الاستفسار",
      requestedInquiryType: "نوع الاستفسار (اختياري)",
      description: "تفاصيل الحالة",
      requestedOutcome: "النتيجة المرجوة",
      declaredUrgency: "درجة الاستعجال",
      nationality: "الجنسية",
      currentStatus: "حالة الإقامة أو التقدم الحالية",
      documentCountry: "بلد إصدار المستند",
      targetAgency: "الجهة المستهدفة أو الوجهة",
      dueDate: "التاريخ المفضل أو الموعد النهائي",
      isCorporateRequest: "طلب شركة",
      needsTranslation: "مطلوب ترجمة",
      hasPreparedDocuments: "المستندات المتوفرة حاليًا",
      wantsCallback: "طلب استشارة هاتفية",
      consentToPrivacy: "أوافق على جمع واستخدام المعلومات الشخصية لأغراض الاستشارة."
    },
    placeholders: {
      contactName: "مثال: أحمد محمد",
      organizationName: "مثال: شركة ABC العالمية",
      email: "example@email.com",
      phone: "+966-50-000-0000",
      title: "مثال: استفسار عن تغيير تأشيرة E-7",
      description: "يرجى وصف وضعك الحالي والنتيجة المرجوة والموعد النهائي والمستندات المتوفرة والجهة المستهدفة.",
      requestedOutcome: "مثال: تقديم طلب تغيير التأشيرة خلال أسبوعين",
      nationality: "مثال: السعودية، الإمارات، مصر",
      currentStatus: "مثال: إقامة D-10 / المستندات الأصلية متوفرة / مطلوب ترجمة",
      documentCountry: "مثال: السعودية، الإمارات",
      targetAgency: "مثال: مكتب الهجرة، البنك، المدرسة"
    },
    buttons: {
      submit: "إرسال",
      submitting: "جاري الإرسال...",
      resetResult: "إغلاق النتيجة"
    },
    clientTypeOptions: {
      INDIVIDUAL: "فرد",
      COMPANY: "شركة"
    },
    callbackHelp: "الحالات العاجلة أو المعقدة يمكن تحديدها للمتابعة الهاتفية ذات الأولوية بعد مراجعة المسؤول.",
    optionLabels: {
      corporateYes: "هذا طلب شركة",
      translationYes: "مطلوب ترجمة",
      documentsReady: "لدي مستندات أساسية جاهزة"
    },
    adminLink: "لوحة المسؤول",
    emptyResult: "بعد الإرسال، ستظهر هنا الفئة المُنشأة ودرجة الاستعجال وإرشادات العميل.",
    errorGeneric: "حدث خطأ أثناء الإرسال. يرجى مراجعة النموذج."
  }
} as const;

export function getIntakeCopy(locale: Locale) {
  if (locale === "en") return copy.en;
  if (locale === "ar") return copy.ar;
  return copy.ko;
}
