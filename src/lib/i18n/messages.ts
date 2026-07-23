import type { Locale } from "@/types/inquiry";

const messages = {
  ko: {
    langLabel: "언어",
    heroEyebrow: "행정사 실무 상담 접수",
    heroTitle: "반복 상담을 줄이고, 유효한 사건을 빠르게 분류하는 접수 시스템",
    heroDescription:
      "비자, 출입국, 번역/공증, 기업 행정 문의를 한 화면에서 접수하고 자동 분류합니다.",
    heroPoints: [
      "규칙 기반 자동 분류 + 긴급도 산정",
      "국문/영문 우선 지원",
      "관리자 검토 전 기본 안내문 자동 생성"
    ],
    stats: [
      { label: "처리 범위", value: "6개 문의 유형" },
      { label: "언어", value: "한국어 / English" },
      { label: "흐름", value: "접수 -> 분류 -> 검토" }
    ],
    formTitle: "상담 접수",
    formDescription: "핵심 정보를 입력하면 자동 분류와 기본 안내문이 먼저 생성됩니다.",
    resultTitle: "접수 결과",
    resultDescription: "아래 내용은 자동 생성 초안이며, 관리자 검토 후 확정됩니다.",
    labels: {
      preferredLocale: "희망 응답 언어",
      clientType: "의뢰 형태",
      contactName: "이름",
      organizationName: "회사명",
      email: "이메일",
      phone: "전화번호",
      title: "문의 제목",
      description: "상세 내용",
      nationality: "국적",
      currentStatus: "현재 체류/진행 상태",
      documentCountry: "문서 발행 국가",
      targetAgency: "제출처 또는 사용처",
      dueDate: "희망 일정 또는 마감일",
      wantsCallback: "전화 상담 요청",
      consentToPrivacy: "개인정보 수집 및 상담 목적 이용에 동의합니다."
    },
    placeholders: {
      contactName: "예: 김민지",
      organizationName: "예: ABC Global Co.",
      email: "example@email.com",
      phone: "010-0000-0000",
      title: "예: E-7 체류자격 변경 문의",
      description: "현재 상황, 원하는 결과, 마감일, 보유 자료를 구체적으로 작성해 주세요.",
      nationality: "예: 미국, 인도, 우즈베키스탄",
      currentStatus: "예: D-10 체류 중 / 서류 원본 보유",
      documentCountry: "예: 미국, UAE",
      targetAgency: "예: 출입국사무소, 학교, 은행"
    },
    buttons: {
      submit: "접수하기",
      submitting: "접수 중...",
      newInquiry: "새 문의 작성"
    },
    clientTypeOptions: {
      INDIVIDUAL: "개인",
      COMPANY: "기업"
    },
    callbackHelp: "긴급하거나 복잡한 사안은 검토 후 우선 연락 대상으로 분류될 수 있습니다.",
    adminLink: "관리자 보기",
    completionLabel: "접수 완료 메시지",
    guidanceLabel: "기본 준비 안내",
    summaryLabel: "자동 요약",
    errors: {
      generic: "접수 중 오류가 발생했습니다. 입력값을 확인해 주세요."
    }
  },
  en: {
    langLabel: "Language",
    heroEyebrow: "Administrative Office Intake",
    heroTitle: "A practical intake system that filters qualified cases before live consultation",
    heroDescription:
      "Receive immigration, visa, translation/notary, and corporate requests in one place and classify them automatically.",
    heroPoints: [
      "Rule-based classification and urgency scoring",
      "Korean and English first",
      "Initial guidance generated before admin review"
    ],
    stats: [
      { label: "Coverage", value: "6 inquiry types" },
      { label: "Languages", value: "Korean / English" },
      { label: "Flow", value: "Intake -> Classification -> Review" }
    ],
    formTitle: "Consultation Intake",
    formDescription:
      "Leave key details and the system will generate an initial category, urgency level, and checklist.",
    resultTitle: "Intake Result",
    resultDescription: "This is an auto-generated draft and will be confirmed after admin review.",
    labels: {
      preferredLocale: "Response language",
      clientType: "Client type",
      contactName: "Name",
      organizationName: "Company",
      email: "Email",
      phone: "Phone",
      title: "Subject",
      description: "Details",
      nationality: "Nationality",
      currentStatus: "Current visa or progress status",
      documentCountry: "Document issuing country",
      targetAgency: "Target authority or destination",
      dueDate: "Preferred date or deadline",
      wantsCallback: "Request phone consultation",
      consentToPrivacy: "I agree to the collection and use of personal information for consultation."
    },
    placeholders: {
      contactName: "Example: Jane Smith",
      organizationName: "Example: ABC Global Co.",
      email: "example@email.com",
      phone: "+82-10-0000-0000",
      title: "Example: E-7 visa change inquiry",
      description:
        "Describe your current situation, desired outcome, deadline, available documents, and target authority.",
      nationality: "Example: United States, India, Uzbekistan",
      currentStatus: "Example: On D-10 / originals available / translation completed",
      documentCountry: "Example: United States, UAE",
      targetAgency: "Example: Immigration office, bank, university"
    },
    buttons: {
      submit: "Submit Inquiry",
      submitting: "Submitting...",
      newInquiry: "Start New Inquiry"
    },
    clientTypeOptions: {
      INDIVIDUAL: "Individual",
      COMPANY: "Company"
    },
    callbackHelp:
      "Complex or urgent cases can be flagged for priority phone follow-up after admin review.",
    adminLink: "Open Admin",
    completionLabel: "Receipt Message",
    guidanceLabel: "Initial Checklist",
    summaryLabel: "Auto Summary",
    errors: {
      generic: "Something went wrong while submitting. Please review the form."
    }
  }
} as const;

export function getMessages(locale: Locale) {
  return messages[locale];
}
