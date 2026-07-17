import type { InquiryCaseAnalysis } from "@/lib/services/case-analysis-service";
import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";
import type {
  InquiryStatus,
  InquiryType,
  UrgencyLevel,
} from "@/types/inquiry";

export type SyncConsultationInput = {
  inquiryId: string;
  contactName: string;
  contactPhone?: string | null;
  inquiryTitle: string;
  inquiryType: InquiryType;
  inquiryStatus: InquiryStatus;
  urgencyLevel: UrgencyLevel;
  qualificationScore: number;
  generatedSummary: string;
  recommendedNextStep: string;
  classificationReason?: string | null;
  recommendedDocuments?: string[];
  serviceTags?: string[];
  createdAt?: string | null;
  dueDate?: string | null;
  referenceUrl?: string | null;
};

export type SyncCaseAnalysisInput = {
  inquiryId: string;
  contactName: string;
  contactPhone?: string | null;
  inquiryTitle: string;
  inquiryType: InquiryType;
  inquiryStatus?: InquiryStatus;
  urgencyLevel?: UrgencyLevel;
  qualificationScore?: number;
  generatedSummary?: string | null;
  recommendedNextStep?: string | null;
  classificationReason?: string | null;
  recommendedDocuments?: string[];
  serviceTags?: string[];
  createdAt?: string | null;
  targetAgency?: string | null;
  organizationName?: string | null;
  analysis: InquiryCaseAnalysis;
  contractTitle?: string | null;
  draftNotes?: string | null;
  caseNumber?: string | null;
  dueDate?: string | null;
  workflowStatus?: "시작 전" | "진행 중" | "완료";
  compensationStatus?: string | null;
  lawbotAnalysis?: LawbotCaseAnalysisResult;
};

export type NotionReferenceMaterial = {
  id: string;
  title: string;
  category: string | null;
  resourceType: string | null;
  summary: string | null;
  source: string | null;
  citationUrl: string | null;
  publishedYear: number | null;
  status: string | null;
  /** 자료 활용 상태 — "Lawbot 연결 가능"인 자료만 추천에 오릅니다. */
  usageStatus: string | null;
  /** 출처 등급 (official_core / official_context / internal_template / background_only / must_verify) */
  sourceGrade: string | null;
  /** 자료 신뢰도 (공식 / 준공식 / 실무참고 / 강의·해설 / 논문·연구 / 내부메모 / 미검증) */
  trustLevel: string | null;
  /** 관련 법령/조문 — 인용 시 원문 대조 지점 */
  lawReferences: string | null;
  /** 핵심 키워드 — 노션에서 직접 정리한 검색어 */
  keywords: string[];
  /** 적용 도메인 */
  domains: string[];
  /** 사용 위치 (guidebook / case_outlook / document_draft ...) */
  usageSites: string[];
  /** 최신성 검토일 (ISO date) */
  reviewedAt: string | null;
  /** 출처 등급 또는 사용 위치가 must_verify면 true — 원문 확인 없이 인용 금지 */
  mustVerify: boolean;
  /** 고객 노출 가능 체크 여부 */
  clientVisible: boolean;
  score: number;
};

export type NotionReferenceWebsite = {
  id: string;
  title: string;
  organization: string | null;
  fields: string[];
  description: string | null;
  url: string | null;
  score: number;
};

export type NotionReferenceRecommendations = {
  keywords: string[];
  materials: NotionReferenceMaterial[];
  websites: NotionReferenceWebsite[];
};
