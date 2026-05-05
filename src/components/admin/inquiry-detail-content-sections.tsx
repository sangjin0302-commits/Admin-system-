import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CustomerTrackingNoticeCopyCard } from "@/components/admin/customer-tracking-notice-copy-card";
import { InfoItem } from "@/components/admin/inquiry-detail-common";
import type { IntakeCategoryDetailSummary } from "@/lib/services/intake-category-detail-summary";

type StructuredMemoLike = {
  metadata: {
    memoType?: string;
    recommendationLabel?: string;
    recommendationReason?: string;
    practicalUseStatus?: string;
    signalSummary?: string;
    summary?: string;
    priorityMaterials?: string[];
    riskFlags?: string[];
  };
};

export function InquiryDetailEvidenceSection(input: {
  requestedInquiryTypeLabel: string;
  declaredUrgencyLabel: string;
  dueDateLabel: string;
  nationality?: string | null;
  currentStatus?: string | null;
  documentCountry?: string | null;
  targetAgency?: string | null;
  hasPreparedDocuments: boolean;
  needsTranslation: boolean;
  wantsCallback: boolean;
  description: string;
  requestedOutcome?: string | null;
}) {
  return (
    <Card id="detail-evidence" className="p-6">
      <h3 className="ui-section-title">문의 원문</h3>
      <div className="mt-5 grid gap-4 text-sm text-text sm:grid-cols-2">
        <InfoItem label="국적" value={input.nationality} />
        <InfoItem label="현재 상태" value={input.currentStatus} />
        <InfoItem label="문서 발행국" value={input.documentCountry} />
        <InfoItem label="제출처" value={input.targetAgency} />
        <InfoItem label="요청 문의유형" value={input.requestedInquiryTypeLabel} />
        <InfoItem label="체감 긴급도" value={input.declaredUrgencyLabel} />
        <InfoItem label="희망 일정" value={input.dueDateLabel} />
        <InfoItem label="보유 서류 여부" value={input.hasPreparedDocuments ? "보유" : "미보유"} />
        <InfoItem label="번역 필요 여부" value={input.needsTranslation ? "예" : "아니오"} />
        <InfoItem label="전화상담 희망" value={input.wantsCallback ? "예" : "아니오"} />
      </div>
      <Card muted className="mt-6 p-5">
        <p className="ui-kicker">상세 설명</p>
        <p className="mt-3 whitespace-pre-line text-sm text-text">{input.description}</p>
      </Card>
      <Card muted className="mt-4 p-5">
        <p className="ui-kicker">원하는 결과</p>
        <p className="mt-3 whitespace-pre-line text-sm text-text">
          {input.requestedOutcome || "미입력"}
        </p>
      </Card>
    </Card>
  );
}

export function InquiryDetailIntakeCategorySection(input: {
  summary: IntakeCategoryDetailSummary;
  urgencyLabel: string;
  publicTrackingCode: string | null;
}) {
  const { summary } = input;

  return (
    <Card className="p-6">
      <h3 className="ui-section-title">접수 업무 분야</h3>
      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">고객용 접수번호</p>
        <p className="mt-2 text-sm font-semibold text-text-strong">
          {input.publicTrackingCode || "아직 발급된 고객용 접수번호가 없습니다."}
        </p>
      </Card>
      <CustomerTrackingNoticeCopyCard trackingCode={input.publicTrackingCode} />
      {summary.categoryLabel ? (
        <>
          <div className="mt-5 grid gap-4 text-sm text-text sm:grid-cols-2">
            <InfoItem label="업무 분야" value={summary.categoryLabel} />
            <InfoItem label="세부 유형" value={summary.subtypeLabel} />
            <InfoItem label="긴급도" value={input.urgencyLabel} />
            <InfoItem label="희망 상담 방식" value={summary.consultationMethod} />
            <InfoItem label="희망 언어" value={summary.preferredLanguage} />
            <InfoItem label="관련 서류 보유 여부" value={summary.documentAvailability} />
          </div>
          {summary.detailRows.length > 0 ? (
            <div className="mt-6">
              <p className="ui-kicker">분야별 주요 답변</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {summary.detailRows.map((row) => (
                  <InfoItem key={`${row.label}-${row.value}`} label={row.label} value={row.value} />
                ))}
              </div>
            </div>
          ) : (
            <Card muted className="mt-6 p-5">
              <p className="text-sm text-text-muted">분야별 추가 답변이 없습니다.</p>
            </Card>
          )}
        </>
      ) : (
        <Card muted className="mt-5 p-5">
          <p className="text-sm text-text-muted">접수 분야 정보가 아직 없습니다.</p>
        </Card>
      )}
    </Card>
  );
}

export function InquiryDetailInternalMemoSection(input: {
  structuredInternalMemo: StructuredMemoLike | null;
  internalMemoDisplay: string;
}) {
  return (
    <Card className="p-6">
      <h3 className="ui-section-title">내부 메모</h3>
      {input.structuredInternalMemo ? (
        <Card muted className="mt-4 p-5">
          <p className="ui-kicker">운영 메모 구조 요약</p>
          <div className="mt-4 grid gap-4 text-sm text-text sm:grid-cols-2">
            <InfoItem label="메모 유형" value={input.structuredInternalMemo.metadata.memoType || "-"} />
            <InfoItem label="추천 경로" value={input.structuredInternalMemo.metadata.recommendationLabel || "-"} />
            <InfoItem label="추천 근거" value={input.structuredInternalMemo.metadata.recommendationReason || "-"} />
            <InfoItem label="실전 사용 상태" value={input.structuredInternalMemo.metadata.practicalUseStatus || "-"} />
            <InfoItem label="혼합 신호" value={input.structuredInternalMemo.metadata.signalSummary || "-"} />
            <InfoItem label="핵심 요약" value={input.structuredInternalMemo.metadata.summary || "-"} />
          </div>
          {input.structuredInternalMemo.metadata.priorityMaterials?.length ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">우선 자료</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {input.structuredInternalMemo.metadata.priorityMaterials.map((item) => (
                  <Badge
                    key={`memo-material-${item}`}
                    className="border-line-strong bg-white text-text-strong"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {input.structuredInternalMemo.metadata.riskFlags?.length ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">리스크</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {input.structuredInternalMemo.metadata.riskFlags.map((item) => (
                  <Badge
                    key={`memo-risk-${item}`}
                    className="border-amber-200 bg-amber-50 text-amber-800"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
      <Card muted className="mt-4 p-5">
        <p className="whitespace-pre-line text-sm text-text">
          {input.internalMemoDisplay || "아직 저장된 내부 메모가 없습니다."}
        </p>
      </Card>
    </Card>
  );
}

export function InquiryDetailPrecheckSection(input: {
  inquiryTypeLabel: string;
  urgencyLabel: string;
  consultationRequired: boolean;
  classificationConfidencePercent: number;
  qualificationScore: number;
  classificationReason: string;
  riskComplexityHint?: string | null;
  recommendedNextStep: string;
  precheckDocs: string[];
  tags: string[];
}) {
  return (
    <Card className="p-6">
      <h3 className="ui-section-title">사전진단 결과</h3>
      <div className="mt-5 grid gap-3">
        <InfoItem label="문의 유형" value={input.inquiryTypeLabel} />
        <InfoItem label="긴급도" value={input.urgencyLabel} />
        <InfoItem label="상담 필요 여부" value={input.consultationRequired ? "필요" : "기본 안내 후 진행"} />
        <InfoItem label="분류 신뢰도" value={`${input.classificationConfidencePercent}%`} />
        <InfoItem label="수임 적합도" value={`${input.qualificationScore} / 100`} />
      </div>
      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">진단 근거</p>
        <p className="mt-3 text-sm text-text">{input.classificationReason}</p>
      </Card>
      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">리스크·난이도 힌트</p>
        <p className="mt-3 text-sm text-text">{input.riskComplexityHint || "일반 수준"}</p>
      </Card>
      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">권장 다음 조치</p>
        <p className="mt-3 text-sm text-text">{input.recommendedNextStep}</p>
      </Card>
      <Card muted className="mt-5 p-5">
        <p className="ui-kicker">준비 권장 서류</p>
        <ul className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text">
          {input.precheckDocs.length > 0 ? (
            input.precheckDocs.map((doc) => <li key={doc}>{doc}</li>)
          ) : (
            <li>서류 목록 자동 생성 없음</li>
          )}
        </ul>
      </Card>
      <div className="mt-4 flex flex-wrap gap-2">
        {input.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
    </Card>
  );
}
