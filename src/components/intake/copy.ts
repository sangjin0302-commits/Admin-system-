import type { Locale } from "@/types/inquiry";

const copy = {
  ko: {
    pageKicker: "행정사 상담 접수",
    pageTitle: "전문 분야 중심의 초기 상담 접수",
    pageDescription:
      "접수 내용을 바탕으로 문의 유형, 긴급도, 기본 안내 메시지가 자동 생성됩니다. 최종 진행 가능 여부와 처리 방향은 관리자 검토 후 확정됩니다.",
    infoTitle: "안내",
    infoItems: [
      "주요 전문 분야는 외국인 비자, 출입국·체류, 행정심판, 인허가입니다.",
      "그 밖의 행정사 업무도 접수할 수 있으며, 내용 확인 후 추가 안내가 필요한 분야로 분류될 수 있습니다.",
      "번역·공증, 아포스티유·영사확인처럼 직접 수행하지 않는 업무는 제휴 또는 안내 가능 여부를 별도로 검토합니다.",
      "영문 접수도 가능하지만 실제 진행 가능 여부는 관리자 검토 후 확정됩니다."
    ],
    formTitle: "상담 접수 작성",
    resultTitle: "자동 생성 결과",
    resultDescription: "접수 직후 생성되는 초안입니다. 관리자 검토 후 실제 안내에 반영됩니다.",
    labels: {
      preferredLocale: "응답 언어",
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
      contactName: "예: 김민지",
      organizationName: "예: ABC Global Co.",
      email: "example@email.com",
      phone: "010-0000-0000",
      title: "예: E-7 비자 변경 가능 여부 문의",
      description: "현재 상황, 원하는 결과, 마감일, 보유 중인 서류, 제출처를 적어주세요.",
      requestedOutcome: "예: 2주 내 체류자격 변경 접수 완료",
      nationality: "예: 미국, 인도, 우즈베키스탄",
      currentStatus: "예: D-10 체류 중 / 원본 문서 보유 / 보완 요청 수령",
      documentCountry: "예: 미국, UAE",
      targetAgency: "예: 출입국사무소, 구청, 교육청"
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
      corporateYes: "기업 또는 법인 관련 의뢰입니다.",
      translationYes: "제출을 위해 번역이 필요한 자료가 있습니다.",
      documentsReady: "기본 서류를 이미 보유하고 있습니다."
    },
    adminLink: "관리자 화면",
    emptyResult: "접수 후 이 영역에서 자동 분류, 긴급도, 기본 안내 메시지를 확인할 수 있습니다.",
    errorGeneric: "접수 처리 중 오류가 발생했습니다. 입력값을 다시 확인해 주세요."
  },
  en: {
    pageKicker: "Administrative Office Intake",
    pageTitle: "Initial consultation intake centered on core specialties",
    pageDescription:
      "After submission, the system generates a provisional inquiry type, urgency level, and client guidance draft. Final handling is confirmed after admin review.",
    infoTitle: "Notes",
    infoItems: [
      "Core specialties include foreigner visas, immigration and stay matters, administrative appeals, and licenses or permits.",
      "Other administrative matters may also be submitted and can be classified for additional review after intake.",
      "For translation, notarization, apostille, or consular legalization, we may first review whether guidance or referral is appropriate.",
      "You may submit in English, but final handling is confirmed after admin review."
    ],
    formTitle: "Submit an Inquiry",
    resultTitle: "Generated Draft",
    resultDescription: "This draft is created immediately after submission and may be adjusted after admin review.",
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
      currentStatus: "Example: On D-10 / original documents available / supplement requested",
      documentCountry: "Example: United States, UAE",
      targetAgency: "Example: Immigration office, district office, education office"
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
      corporateYes: "This is a corporate or company-related request.",
      translationYes: "Some documents may require translation for filing.",
      documentsReady: "I already have the base documents."
    },
    adminLink: "Admin Dashboard",
    emptyResult: "After submission, this panel will show the generated category, urgency, and client guidance.",
    errorGeneric: "There was an error while submitting. Please review the form."
  }
} as const;

export function getIntakeCopy(locale: Locale) {
  return locale === "en" ? copy.en : copy.ko;
}
