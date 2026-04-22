import type { LocaleMessages } from "@/i18n/shared";

type IntakePageKey =
  | "switchToEnglish"
  | "switchToKorean"
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

export const intakePageMessages: LocaleMessages<IntakePageKey> = {
  ko: {
    switchToEnglish: "English",
    switchToKorean: "한국어",
    heroKicker: "온라인 접수",
    heroTitle: "행정업무 상담을 빠르게 접수하세요",
    heroDescription:
      "필수 정보만 먼저 입력하면 접수 후 검토 단계와 다음 안내를 한 번에 확인할 수 있습니다.",
    prepTitle: "빠른 검토를 위한 준비 정보",
    prepDescription: "아래 항목을 함께 전달하면 초기 검토와 상담 안내가 더 정확해집니다.",
    prepItemCurrentStatus: "현재 상황: 체류·처분·진행 상태를 간단히 정리",
    prepItemGoalAndDeadline: "원하는 결과와 목표 일정 또는 마감일",
    prepItemAvailableDocuments: "보유 문서 여부(원본·번역 필요 여부 포함)",
    prepItemTargetAgency: "제출 예정 기관 또는 사용처 정보",
    formTitle: "접수 정보 입력",
    formDescription: "필수 항목부터 입력한 뒤 필요 시 선택 정보를 추가해 주세요."
  },
  en: {
    switchToEnglish: "English",
    switchToKorean: "한국어",
    heroKicker: "Online intake",
    heroTitle: "Submit your administrative inquiry quickly",
    heroDescription:
      "Start with required information and receive clear next-step guidance after submission.",
    prepTitle: "Information that speeds up review",
    prepDescription: "Including the items below helps us triage your case faster and more accurately.",
    prepItemCurrentStatus: "Current status: visa, sanction, or progress summary",
    prepItemGoalAndDeadline: "Desired outcome and target date or deadline",
    prepItemAvailableDocuments: "Available documents and translation needs",
    prepItemTargetAgency: "Target authority or destination",
    formTitle: "Intake details",
    formDescription: "Complete required fields first, then add optional details if helpful."
  }
};
