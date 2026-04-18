"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DocumentBlock,
  FieldBlock,
  ListCard,
  MessageCard
} from "@/components/admin/quote-workspace-ui";
import {
  caseStageLabels,
  formatRange,
  quoteStatusLabels
} from "@/lib/services/quote-workspace-helpers";
import type { QuoteSummarySnapshot, QuoteWorkspace } from "@/lib/quote-engine/types";
import { formatCurrency } from "@/lib/quote-engine/utils";

export function QuoteAnalysisSection({
  workspace,
  caseAnalysisDraft,
  lawbotAnalysisDraft,
  actionChecklist,
  actionTemplates,
  onAppendDraftNotes,
  onCopyMessage
}: {
  workspace: QuoteWorkspace;
  caseAnalysisDraft: string;
  lawbotAnalysisDraft: string | null;
  actionChecklist: string[];
  actionTemplates: {
    documentRequest: string;
    cautiousReview: string;
    quoteAdvance: string;
  };
  onAppendDraftNotes: () => void;
  onCopyMessage: (text: string, label: string) => void;
}) {
  return (
    <Card id="quote-analysis" className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>사건 분석</Badge>
            <Badge className="border-primary/20 bg-primary-soft text-primary">
              {workspace.caseAnalysis.strengthLabel} · {workspace.caseAnalysis.strengthScore}점
            </Badge>
          </div>
          <h3 className="mt-4 ui-section-title">견적 전 사건 분석</h3>
          <p className="mt-2 text-sm text-text-muted">사건 분석 요약을 견적 메모와 계약 초안 특약에 바로 반영할 수 있습니다.</p>
        </div>
        <Button variant="secondary" onClick={onAppendDraftNotes}>
          메모에 반영
        </Button>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ListCard title="핵심 쟁점" items={workspace.caseAnalysis.issues} />
        <ListCard title="추가 확인 필요 사실" items={workspace.caseAnalysis.missingFacts} />
      </div>
      <div className="mt-5">
        <ListCard title="권장 액션" items={actionChecklist} />
      </div>
      {workspace.lawbotAnalysis.status === "available" ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <ListCard title="Lawbot 핵심 쟁점" items={workspace.lawbotAnalysis.data.key_issues} />
          <ListCard
            title="Lawbot 참고 판례"
            items={
              workspace.lawbotAnalysis.data.related_precedents?.map(
                (item) =>
                  `${item.case_name} / ${item.case_number}${item.court_name ? ` / ${item.court_name}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}`
              ) ?? []
            }
          />
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <MessageCard
          title="추가서류 요청"
          message={actionTemplates.documentRequest}
          onCopy={() => onCopyMessage(actionTemplates.documentRequest, "추가서류 요청")}
        />
        <MessageCard
          title="보수 검토 안내"
          message={actionTemplates.cautiousReview}
          onCopy={() => onCopyMessage(actionTemplates.cautiousReview, "보수 검토 안내")}
        />
        <MessageCard
          title="견적 진행 안내"
          message={actionTemplates.quoteAdvance}
          onCopy={() => onCopyMessage(actionTemplates.quoteAdvance, "견적 진행 안내")}
        />
      </div>
    </Card>
  );
}

export function QuoteSummarySection({ quote }: { quote: QuoteSummarySnapshot }) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>견적 관리</Badge>
        <Badge className="border-primary/20 bg-primary-soft text-primary">상태: {quoteStatusLabels[quote.status]}</Badge>
      </div>
      <h3 className="mt-4 ui-section-title">견적 요약</h3>
      <p className="mt-2 whitespace-pre-line text-sm text-text-muted">
        {quote.calculationSummary ?? "계산 요약이 아직 없습니다."}
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoPanel label="서비스 기본가" value={formatRange(quote.serviceBaseMin, quote.serviceBaseMax)} />
        <InfoPanel label="소계" value={formatRange(quote.subtotalMin, quote.subtotalMax)} />
        <InfoPanel label="VAT" value={formatRange(quote.vatAmountMin, quote.vatAmountMax)} />
        <InfoPanel label="총액" value={formatRange(quote.totalMin, quote.totalMax)} />
        <InfoPanel
          label="상담료"
          value={quote.consultFee > 0 ? `${formatCurrency(quote.consultFee)} (수임 시 공제)` : "없음"}
        />
        <InfoPanel label="최종 수정" value={new Date(quote.updatedAt).toLocaleString("ko-KR")} />
      </div>
    </Card>
  );
}

export function QuoteContractSection({
  quote,
  quoteStatus,
  caseDueDate,
  caseInternalMemo,
  specialTerms,
  recommendedSpecialTerms,
  isPending,
  onQuoteStatusChange,
  onCaseDueDateChange,
  onCaseInternalMemoChange,
  onSpecialTermsChange,
  onAppendSpecialTerms,
  onUpdateStatus,
  onCreateContractDraft
}: {
  quote: QuoteSummarySnapshot;
  quoteStatus: QuoteSummarySnapshot["status"];
  caseDueDate: string;
  caseInternalMemo: string;
  specialTerms: string;
  recommendedSpecialTerms: string;
  isPending: boolean;
  onQuoteStatusChange: (status: QuoteSummarySnapshot["status"]) => void;
  onCaseDueDateChange: (value: string) => void;
  onCaseInternalMemoChange: (value: string) => void;
  onSpecialTermsChange: (value: string) => void;
  onAppendSpecialTerms: () => void;
  onUpdateStatus: () => void;
  onCreateContractDraft: () => void;
}) {
  return (
    <Card id="quote-contract" className="p-6">
      <h3 className="ui-section-title">상태 변경 및 계약 초안</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <FieldBlock label="견적 상태">
          <Select value={quoteStatus} onChange={(event) => onQuoteStatusChange(event.target.value as QuoteSummarySnapshot["status"])}>
            {Object.entries(quoteStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FieldBlock>
        <FieldBlock label="사건 기한">
          <Input type="date" value={caseDueDate} onChange={(event) => onCaseDueDateChange(event.target.value)} />
        </FieldBlock>
      </div>
      <div className="mt-4">
        <FieldBlock label="사건 내부 메모">
          <Textarea rows={4} value={caseInternalMemo} onChange={(event) => onCaseInternalMemoChange(event.target.value)} />
        </FieldBlock>
      </div>
      <div className="mt-4">
        <FieldBlock label="특약 직접 편집">
          <div className="mb-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onAppendSpecialTerms} disabled={!quote.contractDraft}>
              권장 특약 불러오기
            </Button>
          </div>
          <Textarea
            rows={8}
            value={specialTerms}
            onChange={(event) => onSpecialTermsChange(event.target.value)}
            placeholder={
              quote.contractDraft
                ? "환불 기준, 추가 비용 정산, 자료 제출 협조, 업무 제외 범위 등 사건별 특약을 직접 적어둘 수 있습니다."
                : "계약 초안을 먼저 생성하면 사건별 특약을 직접 편집할 수 있습니다."
            }
            disabled={!quote.contractDraft}
          />
        </FieldBlock>
        <p className="mt-2 text-xs text-text-muted">
          계약 초안이 이미 생성된 경우 이 특약은 수정 내용 저장 후 유지됩니다. 자동 분석 참고는 아래 문서 미리보기에도 함께 반영됩니다.
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={onUpdateStatus} disabled={isPending}>
          {isPending ? "반영 중..." : "상태 반영"}
        </Button>
        <Button variant="secondary" onClick={onCreateContractDraft} disabled={isPending}>
          {isPending ? "생성 중..." : "계약 초안 생성"}
        </Button>
      </div>

      {quote.contractDraft ? (
        <Card muted className="mt-5 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-text-strong">{quote.contractDraft.title}</p>
              <p className="mt-2 text-xs text-text-muted">최근 수정: {new Date(quote.contractDraft.updatedAt).toLocaleString("ko-KR")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={`/api/admin/quotes/${quote.id}/contract-draft/export`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition hover:opacity-90"
              >
                계약 초안 열기
              </a>
              <a
                href={`/api/admin/quotes/${quote.id}/contract-draft/export?download=1`}
                className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong px-4 text-sm font-medium text-text-strong transition hover:bg-surface"
              >
                파일 다운로드
              </a>
            </div>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <DocumentBlock title="계약 본문" content={quote.contractDraft.bodyText} />
            <div className="space-y-4">
              {quote.contractDraft.scopeText ? (
                <DocumentBlock title="업무 범위" content={quote.contractDraft.scopeText} compact />
              ) : null}
              {quote.contractDraft.paymentSummary ? (
                <DocumentBlock title="결제 안내" content={quote.contractDraft.paymentSummary} compact />
              ) : null}
              {quote.contractDraft.specialTerms ? (
                <DocumentBlock title="특약 및 사건 분석 참고" content={quote.contractDraft.specialTerms} compact />
              ) : null}
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="계약 초안이 아직 없습니다."
          description="계약 초안 생성 버튼을 누르면 화면 미리보기와 다운로드 파일이 함께 준비됩니다."
          className="mt-5"
        />
      )}

      {quote.caseRecord ? (
        <Card muted className="mt-4 p-5">
          <p className="text-sm font-semibold text-text-strong">사건 번호: {quote.caseRecord.caseNumber}</p>
          <div className="mt-3 grid gap-2 text-sm text-text-muted sm:grid-cols-2">
            <p>현재 단계: {caseStageLabels[quote.caseRecord.currentStage]}</p>
            <p>기한: {quote.caseRecord.dueDate ? quote.caseRecord.dueDate.slice(0, 10) : "-"}</p>
            <p className="sm:col-span-2">내부 메모: {quote.caseRecord.internalMemo || "-"}</p>
          </div>
        </Card>
      ) : null}
    </Card>
  );
}

export function QuoteMessagesSection({
  quote,
  onCopyMessage
}: {
  quote: QuoteSummarySnapshot;
  onCopyMessage: (text: string, label: string) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <MessageCard
        title="견적 발송 문구 (KO)"
        message={quote.messageDrafts.quoteSendKo}
        onCopy={() => onCopyMessage(quote.messageDrafts.quoteSendKo, "견적 발송 문구")}
      />
      <MessageCard
        title="견적 발송 문구 (EN)"
        message={quote.messageDrafts.quoteSendEn}
        onCopy={() => onCopyMessage(quote.messageDrafts.quoteSendEn, "영문 견적 발송 문구")}
      />
      <MessageCard
        title="수락 안내 문구 (KO)"
        message={quote.messageDrafts.acceptedKo}
        onCopy={() => onCopyMessage(quote.messageDrafts.acceptedKo, "수락 안내 문구")}
      />
      <MessageCard
        title="수락 안내 문구 (EN)"
        message={quote.messageDrafts.acceptedEn}
        onCopy={() => onCopyMessage(quote.messageDrafts.acceptedEn, "영문 수락 안내 문구")}
      />
    </div>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <Card muted className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm font-medium text-text-strong">{value}</p>
    </Card>
  );
}
