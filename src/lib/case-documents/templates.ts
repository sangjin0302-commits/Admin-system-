import type { InquiryType } from "@/types/inquiry";

export type CaseDocumentTemplateItem = {
  documentType: string;
  label: string;
  isRequired: boolean;
  sortOrder: number;
};

const visaDocuments: CaseDocumentTemplateItem[] = [
  { documentType: "passport_copy", label: "여권 사본", isRequired: true, sortOrder: 0 },
  { documentType: "arc_copy", label: "외국인등록증 사본", isRequired: true, sortOrder: 1 },
  { documentType: "application_form", label: "신청서 초안", isRequired: true, sortOrder: 2 },
  { documentType: "employment_or_reason", label: "고용계약서 또는 연장 사유 입증자료", isRequired: true, sortOrder: 3 },
  { documentType: "photo", label: "증명사진", isRequired: false, sortOrder: 4 }
];

const translationDocuments: CaseDocumentTemplateItem[] = [
  { documentType: "source_document", label: "원문 문서", isRequired: true, sortOrder: 0 },
  { documentType: "translation_draft", label: "번역본 초안", isRequired: true, sortOrder: 1 },
  { documentType: "requester_id", label: "의뢰인 신분증 사본", isRequired: false, sortOrder: 2 }
];

const apostilleDocuments: CaseDocumentTemplateItem[] = [
  { documentType: "original_doc", label: "원본 문서", isRequired: true, sortOrder: 0 },
  { documentType: "notary_status", label: "공증 여부 확인자료", isRequired: true, sortOrder: 1 },
  { documentType: "issuance_country", label: "발행국가/제출처 정보", isRequired: true, sortOrder: 2 },
  { documentType: "deadline_note", label: "희망 처리일", isRequired: false, sortOrder: 3 }
];

const corporateDocuments: CaseDocumentTemplateItem[] = [
  { documentType: "biz_reg", label: "사업자등록증", isRequired: true, sortOrder: 0 },
  { documentType: "corp_register", label: "법인등기부등본", isRequired: true, sortOrder: 1 },
  { documentType: "authorization", label: "담당자 위임/권한 확인자료", isRequired: true, sortOrder: 2 },
  { documentType: "doc_list", label: "대상 문서 목록", isRequired: true, sortOrder: 3 },
  { documentType: "submission_target", label: "제출처 및 제출 기한", isRequired: true, sortOrder: 4 }
];

const defaultDocuments: CaseDocumentTemplateItem[] = [
  { documentType: "request_summary", label: "요청사항 정리본", isRequired: true, sortOrder: 0 },
  { documentType: "identity_or_entity", label: "신분증/법인 확인자료", isRequired: true, sortOrder: 1 },
  { documentType: "supporting_docs", label: "관련 입증자료", isRequired: false, sortOrder: 2 }
];

export function getDefaultCaseDocumentTemplates(inquiryType: InquiryType) {
  switch (inquiryType) {
    case "FOREIGNER_VISA":
    case "IMMIGRATION_STAY":
      return visaDocuments;
    case "TRANSLATION_NOTARY":
      return translationDocuments;
    case "APOSTILLE_CONSULAR":
      return apostilleDocuments;
    case "CORPORATE_REQUEST":
      return corporateDocuments;
    default:
      return defaultDocuments;
  }
}
