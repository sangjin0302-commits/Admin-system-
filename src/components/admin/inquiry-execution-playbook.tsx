"use client";

import { Card } from "@/components/ui/card";
import type { NotionReferenceRecommendations } from "@/lib/integrations/notion";
import type { InquiryCaseAnalysis } from "@/lib/services/case-analysis-service";
import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";

type InquiryExecutionPlaybookProps = {
  analysis: InquiryCaseAnalysis;
  lawbotAnalysis: LawbotCaseAnalysisResult;
  references: NotionReferenceRecommendations;
};

export function InquiryExecutionPlaybookSafeV3({
  analysis,
  lawbotAnalysis,
  references
}: InquiryExecutionPlaybookProps) {
  const lawbotQueries =
    lawbotAnalysis.status === "available"
      ? lawbotAnalysis.data.next_search_recommendations.slice(0, 3)
      : [];

  const customerSteps = [
    analysis.communicationGuidance.clientSummary,
    analysis.communicationGuidance.documentRequest
  ].filter(Boolean);

  const internalSteps = [...analysis.immediateActions, ...analysis.missingFacts.slice(0, 3)].filter(
    (item, index, list) => item && list.indexOf(item) === index
  );

  const referenceSteps = [
    ...references.materials.slice(0, 2).map((item) => `내부 자료 확인: ${item.title}`),
    ...references.websites.slice(0, 2).map((item) => `기관 홈페이지 확인: ${item.title}`),
    ...lawbotQueries.map((item) => `Lawbot 후속 검색: ${item}`)
  ];

  return (
    <Card className="p-6">
      <div>
        <h3 className="ui-section-title">실행 플레이북</h3>
        <p className="mt-2 text-sm text-text-muted">
          사건 판단 결과를 바로 실행으로 옮길 수 있도록 오늘 할 일, 고객 전달 문안, 참고 리서치 루트를 한 번에 정리합니다.
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <PlaybookList
          title="오늘 내부에서 할 일"
          emptyMessage="추가 실행 항목이 없습니다."
          items={internalSteps}
        />
        <PlaybookList
          title="고객에게 바로 전달할 내용"
          emptyMessage="즉시 발송할 안내 초안이 없습니다."
          items={customerSteps}
          preserveParagraphs
        />
        <PlaybookList
          title="판례·법령 리서치 루트"
          emptyMessage="추가 리서치 제안이 없습니다."
          items={referenceSteps}
        />
      </div>
    </Card>
  );
}

function PlaybookList({
  title,
  items,
  emptyMessage,
  preserveParagraphs = false
}: {
  title: string;
  items: string[];
  emptyMessage: string;
  preserveParagraphs?: boolean;
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
          {items.map((item) => (
            <li key={`${title}-${item}`} className={preserveParagraphs ? "whitespace-pre-line" : ""}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-text-muted">{emptyMessage}</p>
      )}
    </Card>
  );
}

