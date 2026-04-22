import type { LocaleMessages } from "@/i18n/shared";

type CaseMatterStatusKey =
  | "INTAKE_REVIEW"
  | "CONSULTING"
  | "QUOTED"
  | "CONTRACT_PENDING"
  | "OPEN"
  | "DOCUMENT_COLLECTING"
  | "DOCUMENT_REVIEWING"
  | "READY_TO_SUBMIT"
  | "SUBMITTED"
  | "SUPPLEMENT_REQUESTED"
  | "WAITING_AGENCY"
  | "RESULT_RECEIVED"
  | "CLOSING"
  | "CLOSED"
  | "CANCELLED"
  | "ON_HOLD";

type RequiredDocumentStatusKey =
  | "NEEDED"
  | "REQUESTED"
  | "RECEIVED"
  | "IN_REVIEW"
  | "APPROVED"
  | "NEEDS_FIX"
  | "REJECTED"
  | "NOT_APPLICABLE";

export const caseMatterStatusLabelMessages: LocaleMessages<CaseMatterStatusKey> = {
  ko: {
    INTAKE_REVIEW: "접수 검토",
    CONSULTING: "상담 진행",
    QUOTED: "견적 제안",
    CONTRACT_PENDING: "계약 대기",
    OPEN: "사건 진행",
    DOCUMENT_COLLECTING: "서류 수집",
    DOCUMENT_REVIEWING: "서류 검토",
    READY_TO_SUBMIT: "제출 준비 완료",
    SUBMITTED: "제출 완료",
    SUPPLEMENT_REQUESTED: "보완 요청",
    WAITING_AGENCY: "기관 심사 대기",
    RESULT_RECEIVED: "결과 수신",
    CLOSING: "종결 처리",
    CLOSED: "종결",
    CANCELLED: "취소",
    ON_HOLD: "보류"
  },
  en: {
    INTAKE_REVIEW: "Intake review",
    CONSULTING: "Consulting",
    QUOTED: "Quoted",
    CONTRACT_PENDING: "Contract pending",
    OPEN: "Open",
    DOCUMENT_COLLECTING: "Document collecting",
    DOCUMENT_REVIEWING: "Document reviewing",
    READY_TO_SUBMIT: "Ready to submit",
    SUBMITTED: "Submitted",
    SUPPLEMENT_REQUESTED: "Supplement requested",
    WAITING_AGENCY: "Waiting agency",
    RESULT_RECEIVED: "Result received",
    CLOSING: "Closing",
    CLOSED: "Closed",
    CANCELLED: "Cancelled",
    ON_HOLD: "On hold"
  }
};

export const requiredDocumentStatusLabelMessages: LocaleMessages<RequiredDocumentStatusKey> = {
  ko: {
    NEEDED: "필요",
    REQUESTED: "요청됨",
    RECEIVED: "수신됨",
    IN_REVIEW: "검토 중",
    APPROVED: "확인됨",
    NEEDS_FIX: "보완 필요",
    REJECTED: "반려",
    NOT_APPLICABLE: "해당 없음"
  },
  en: {
    NEEDED: "Needed",
    REQUESTED: "Requested",
    RECEIVED: "Received",
    IN_REVIEW: "In review",
    APPROVED: "Approved",
    NEEDS_FIX: "Needs fix",
    REJECTED: "Rejected",
    NOT_APPLICABLE: "Not applicable"
  }
};
