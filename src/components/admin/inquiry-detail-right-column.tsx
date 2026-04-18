import type { ComponentProps } from "react";

import { InquiryCaseAnalysisPanel } from "@/components/admin/inquiry-case-analysis-panel";
import { InquiryCaseTimelineV2 } from "@/components/admin/inquiry-case-timeline-v2";
import { InquiryCommunicationCenterV2 } from "@/components/admin/inquiry-communication-center-v2";
import { InquiryDetailPrecheckSection } from "@/components/admin/inquiry-detail-content-sections";
import { InquiryDecisionBoard } from "@/components/admin/inquiry-decision-board";
import { InquiryExecutionPlaybookSafeV3 } from "@/components/admin/inquiry-execution-playbook-safe-v3";
import { InquiryCommunicationLogPanel } from "@/components/admin/inquiry-communication-log-panel";
import { InquiryMessagePreview } from "@/components/admin/inquiry-message-preview";
import { InquiryOperationsFeedPanel } from "@/components/admin/inquiry-operations-feed-panel-clean";
import { InquiryStatusHistoryPanel } from "@/components/admin/inquiry-status-history-panel";
import { LawbotCaseAnalysisPanel } from "@/components/admin/lawbot-case-analysis-panel";
import { LawbotSnapshotCompare } from "@/components/admin/lawbot-snapshot-compare";
import { ReferenceRecommendationsPanel } from "@/components/admin/reference-recommendations-panel";
import { Card } from "@/components/ui/card";
import { TextPanel } from "@/components/admin/inquiry-detail-common";

type PrecheckProps = ComponentProps<typeof InquiryDetailPrecheckSection>;
type CaseAnalysis = ComponentProps<typeof InquiryCaseAnalysisPanel>["analysis"];
type LawbotAnalysis = ComponentProps<typeof InquiryDecisionBoard>["lawbotAnalysis"];
type References = ComponentProps<typeof InquiryDecisionBoard>["references"];
type CaseTimelineItems = ComponentProps<typeof InquiryCaseTimelineV2>["items"];
type StatusHistoryItems = ComponentProps<typeof InquiryStatusHistoryPanel>["items"];
type CommunicationPanelProps = ComponentProps<typeof InquiryCommunicationLogPanel>;
type CommunicationCenterProps = ComponentProps<typeof InquiryCommunicationCenterV2>;
type SnapshotCompareProps = ComponentProps<typeof LawbotSnapshotCompare>;
type OperationsFeedProps = ComponentProps<typeof InquiryOperationsFeedPanel>;
type LawbotPanelProps = ComponentProps<typeof LawbotCaseAnalysisPanel>;
type ReferenceRecommendations = ComponentProps<typeof ReferenceRecommendationsPanel>["recommendations"];
type PreviewMessages = ComponentProps<typeof InquiryMessagePreview>["previews"];

export function InquiryDetailRightColumn(input: {
  precheck: PrecheckProps;
  caseAnalysis: CaseAnalysis;
  lawbotAnalysis: LawbotAnalysis;
  references: References;
  qualificationScore: number;
  caseTimelineItems: CaseTimelineItems;
  statusHistoryItems: StatusHistoryItems;
  communicationPanel: CommunicationPanelProps;
  communicationCenter: CommunicationCenterProps;
  snapshotCompare: SnapshotCompareProps;
  operationsFeed: OperationsFeedProps;
  lawbotPanel: LawbotPanelProps;
  referenceRecommendations: ReferenceRecommendations;
  previews: PreviewMessages;
  generatedGuidance: string;
  generatedReceiptMessage: string;
}) {
  return (
    <div className="space-y-6">
      <InquiryDetailPrecheckSection {...input.precheck} />

      <InquiryCaseAnalysisPanel analysis={input.caseAnalysis} />
      <InquiryDecisionBoard
        analysis={input.caseAnalysis}
        lawbotAnalysis={input.lawbotAnalysis}
        references={input.references}
        qualificationScore={input.qualificationScore}
      />
      <InquiryExecutionPlaybookSafeV3
        analysis={input.caseAnalysis}
        lawbotAnalysis={input.lawbotAnalysis}
        references={input.references}
      />
      <InquiryCaseTimelineV2 items={input.caseTimelineItems} />
      <InquiryStatusHistoryPanel items={input.statusHistoryItems} />

      <div id="detail-communication">
        <InquiryCommunicationLogPanel {...input.communicationPanel} />
      </div>

      <InquiryCommunicationCenterV2 {...input.communicationCenter} />

      <LawbotSnapshotCompare
        headline={input.snapshotCompare.headline}
        description={input.snapshotCompare.description}
        fields={input.snapshotCompare.fields}
      />
      <InquiryOperationsFeedPanel
        items={input.operationsFeed.items}
        communicationDraft={input.operationsFeed.communicationDraft}
        communicationDraftDisplay={input.operationsFeed.communicationDraftDisplay}
      />

      <div id="detail-lawbot">
        <LawbotCaseAnalysisPanel
          inquiryId={input.lawbotPanel.inquiryId}
          initialResult={input.lawbotPanel.initialResult}
          connectionSnapshot={input.lawbotPanel.connectionSnapshot}
          storedSnapshot={input.lawbotPanel.storedSnapshot}
        />
      </div>

      <ReferenceRecommendationsPanel recommendations={input.referenceRecommendations} />

      <Card className="p-6">
        <h3 className="ui-section-title">자동 안내 메시지 미리보기</h3>
        <p className="mt-2 text-sm text-text-muted">
          추후 이메일, 문자, 알림톡으로 연결할 때 사용할 템플릿 구조입니다.
        </p>
        <div className="mt-5">
          <InquiryMessagePreview previews={input.previews} />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">현재 생성된 자동 텍스트</h3>
        <TextPanel title="준비 권장 서류" content={input.generatedGuidance} />
        <TextPanel title="접수 완료 메시지" content={input.generatedReceiptMessage} />
      </Card>
    </div>
  );
}
