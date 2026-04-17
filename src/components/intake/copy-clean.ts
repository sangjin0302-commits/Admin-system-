import type { Locale } from "@/types/inquiry";

const copy = {
  ko: {
    pageKicker: "행정사 사무소 상담 접수",
    pageTitle: "실무 연결까지 고려한 초기 상담 접수",
    pageDescription:
      "주요 전문 분야는 외국인 비자, 출입국, 체류, 행정심판, 인허가입니다. 그 밖에 관련 행정사 업무도 접수 가능하며, 문의 내용을 확인한 뒤 추가 안내가 필요한 분야로 분류하여 검토합니다. 접수된 문의는 행정사 검토 후 순차적으로 연락드립니다.",
    infoTitle: "이 화면에서 가능한 접수",
    infoItems: [
      "외국인 비자, 출입국, 체류, 행정심판, 인허가 분야를 중심으로 접수할 수 있습니다.",
      "그 밖에 기타 관련 행정사 업무도 접수 가능하며, 확인 후 추가 안내가 필요한 분야로 분류합니다.",
      "영문 응답이 필요하면 영어로 작성해도 됩니다."
    ],
    processTitle: "접수 후 진행 방식",
    processSteps: [
      "문의 접수 후 기본 분류와 긴급도 초안이 생성됩니다.",
      "관리자가 사실관계와 자료 보유 여부를 확인합니다.",
      "필요 시 자료 요청, 상담 연결, 견적 진행 중 적절한 흐름으로 안내합니다."
    ],
    prepTitle: "접수 전에 준비하면 좋은 정보",
    prepItems: [
      "현재 상황과 문제 발생 시점",
      "원하는 결과와 희망 일정",
      "보유 중인 서류와 아직 없는 서류",
      "제출 예정 기관 또는 상대 기관"
    ],
    formTitle: "상담 접수 작성",
    resultTitle: "접수 직후 생성되는 초안",
    resultDescription: "고객 안내용 초안이며, 관리자 검토 후 실제 회신 방향이 정리됩니다.",
    labels: {
      preferredLocale: "희망 응답 언어",
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
      wantsCallback: "전화 상담 요청",
      consentToPrivacy: "개인정보 수집 및 상담 목적 이용에 동의합니다."
    },
    placeholders: {
      contactName: "예: 김민지",
      organizationName: "예: ABC Global Co.",
      email: "example@email.com",
      phone: "010-0000-0000",
      title: "예: E-7 체류자격 변경 가능 여부 문의",
      description: "현재 상황, 원하는 결과, 마감일, 보유 서류, 제출처를 함께 적어 주세요.",
      requestedOutcome: "예: 2주 내 체류자격 변경 접수 완료",
      nationality: "예: 미국, 인도, 우즈베키스탄",
      currentStatus: "예: D-10 체류 중 / 원본 서류 보유 / 번역 필요",
      documentCountry: "예: 미국, UAE",
      targetAgency: "예: 출입국사무소, 학교, 은행"
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
    callbackHelp: "긴급하거나 설명이 복잡한 건은 검토 후 우선 연락 대상으로 표시될 수 있습니다.",
    optionLabels: {
      corporateYes: "기업 의뢰입니다.",
      translationYes: "번역이 필요합니다.",
      documentsReady: "기본 서류를 이미 보유하고 있습니다."
    },
    adminLink: "관리자 화면",
    emptyResult: "접수 후 이 영역에서 기본 분류, 긴급도, 준비 자료 초안을 확인할 수 있습니다.",
    errorGeneric: "접수 처리 중 오류가 발생했습니다. 입력값을 다시 확인해 주세요.",
    guideTitle: "접수 전 확인",
    guideItems: [
      "안내되는 접수 결과와 초기 분류는 참고용이며, 실제 진행 가능 여부는 자료와 사실관계 확인 후 최종 결정됩니다.",
      "연락 가능한 이메일을 정확히 적어 주세요.",
      "상세 내용은 최소 20자 이상, 문의 제목은 최소 4자 이상 적어 주세요.",
      "현재 상태와 원하는 결과를 분리해서 적으면 검토가 빨라집니다.",
      "보유 서류 여부를 체크하면 자료 요청 단계가 더 정확해집니다."
    ],
    cautionParagraph:
      "안내드리는 접수 결과와 초기 분류는 참고용이며, 실제 진행 가능 여부와 구체적인 업무 범위는 제출 자료와 사실관계 확인 후 최종 결정됩니다. 허위 또는 불명확한 내용이 포함되면 검토가 지연되거나 진행이 어려울 수 있으니, 현재 상황과 원하는 결과를 가능한 한 정확하고 구체적으로 작성해 주세요.",
    nextStepTitle: "접수 후 예상 흐름",
    nextStepConsult: "상담이 필요한 사안이면 담당자가 사실관계 확인 후 상담 연결 여부를 안내합니다.",
    nextStepReview: "기본 서류 확인이 우선인 사안이면 필요한 자료 목록부터 먼저 안내합니다."
  },
  en: {
    pageKicker: "Administrative Office Intake",
    pageTitle: "Initial consultation intake built for real office workflows",
    pageDescription:
      "After submission, the system creates an initial category, urgency level, and preparation guidance draft. Final direction is confirmed after admin review.",
    infoTitle: "What you can submit here",
    infoItems: [
      "You can submit visa, immigration, apostille, translation, civil administrative, and corporate matters.",
      "The generated classification is a draft. Final feasibility and next steps are confirmed after review.",
      "You may write in English if you prefer English communication."
    ],
    processTitle: "What happens after submission",
    processSteps: [
      "A draft category and urgency level are generated immediately after intake.",
      "An admin reviews the facts and available documents.",
      "You are then guided into document collection, consultation, or quotation flow as appropriate."
    ],
    prepTitle: "Helpful details before you submit",
    prepItems: [
      "Your current situation and when the issue started",
      "Your desired outcome and preferred timeline",
      "Documents you already have and documents you do not have yet",
      "The authority, institution, or destination involved"
    ],
    formTitle: "Submit an Inquiry",
    resultTitle: "Immediate intake draft",
    resultDescription: "This is a customer-facing draft and may be refined after admin review.",
    labels: {
      preferredLocale: "Preferred response language",
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
    callbackHelp: "Urgent or complex matters can be flagged for priority follow-up after review.",
    optionLabels: {
      corporateYes: "This is a corporate request",
      translationYes: "Translation is required",
      documentsReady: "I already have base documents"
    },
    adminLink: "Admin Dashboard",
    emptyResult: "After submission, this area will show the draft category, urgency, and preparation guidance.",
    errorGeneric: "There was an error while submitting. Please review the form.",
    guideTitle: "Before you submit",
    guideItems: [
      "Use a reachable email address.",
      "Separate your current situation from your desired outcome.",
      "Mark whether you already have documents for a more accurate follow-up."
    ],
    cautionParagraph:
      "The intake result and initial classification are for reference only. Final feasibility and scope are determined after reviewing the submitted materials and facts. Inaccurate or unclear information may delay review or affect whether the matter can proceed, so please describe your situation and desired outcome as clearly as possible.",
    nextStepTitle: "Likely next step",
    nextStepConsult: "If consultation is needed, the team will review the facts and guide you to the next discussion step.",
    nextStepReview: "If document review comes first, the team will send a focused checklist before moving forward."
  }
} as const;

export function getIntakeCopy(locale: Locale) {
  return locale === "en" ? copy.en : copy.ko;
}
