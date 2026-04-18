import type { InquiryRecord } from "@/lib/services/inquiry-service";
import type {
  LawbotConnectionSnapshot,
  StoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-types";

function buildFactInputLines(inquiry: NonNullable<InquiryRecord>) {
  return [
    `사건 제목: ${inquiry.title}`,
    `문의 유형: ${inquiry.inquiryType}`,
    inquiry.contactName ? `이름: ${inquiry.contactName}` : null,
    inquiry.nationality ? `국적: ${inquiry.nationality}` : null,
    inquiry.currentStatus ? `현재 상태: ${inquiry.currentStatus}` : null,
    inquiry.targetAgency ? `관할 기관: ${inquiry.targetAgency}` : null,
    inquiry.requestedOutcome ? `원하는 결과: ${inquiry.requestedOutcome}` : null,
    inquiry.description ? `상세 내용: ${inquiry.description}` : null,
    inquiry.generatedSummary ? `기존 요약: ${inquiry.generatedSummary}` : null,
    inquiry.classificationReason ? `분류 근거: ${inquiry.classificationReason}` : null,
    inquiry.recommendedNextStep ? `기존 권장 조치: ${inquiry.recommendedNextStep}` : null
  ].filter((value): value is string => Boolean(value));
}

export function buildFactInput(inquiry: NonNullable<InquiryRecord>) {
  return buildFactInputLines(inquiry).join("\n");
}

export function buildLawbotConnectionSnapshot(
  inquiry: NonNullable<InquiryRecord>
): LawbotConnectionSnapshot {
  const analyzeUrl = process.env.LAWBOT_ANALYZE_URL?.trim();
  const analyzeToken = process.env.LAWBOT_ANALYZE_TOKEN?.trim();
  const availableContextLabels = [
    inquiry.contactName ? "이름" : null,
    inquiry.nationality ? "국적" : null,
    inquiry.currentStatus ? "현재 상태" : null,
    inquiry.targetAgency ? "관할 기관" : null,
    inquiry.requestedOutcome ? "원하는 결과" : null,
    inquiry.description ? "상세 내용" : null,
    inquiry.generatedSummary ? "기존 요약" : null,
    inquiry.classificationReason ? "분류 근거" : null,
    inquiry.recommendedNextStep ? "기존 권장 조치" : null
  ].filter((value): value is string => Boolean(value));
  const recommendedMissingFields = [
    inquiry.description ? null : "상세 내용",
    inquiry.requestedOutcome ? null : "원하는 결과",
    inquiry.currentStatus ? null : "현재 상태",
    inquiry.targetAgency ? null : "관할 기관",
    inquiry.nationality ? null : "국적"
  ].filter((value): value is string => Boolean(value));

  return {
    connectionReady: Boolean(analyzeUrl && analyzeToken),
    hasAnalyzeUrl: Boolean(analyzeUrl),
    hasAnalyzeToken: Boolean(analyzeToken),
    recommendedMissingFields,
    availableContextLabels,
    factInputPreview: buildFactInputLines(inquiry).join("\n")
  };
}

export function buildStoredLawbotSnapshot(
  inquiry: Pick<
    NonNullable<InquiryRecord>,
    | "lawbotLastAnalyzedAt"
    | "lawbotSnapshotVersion"
    | "lawbotSnapshotStatus"
    | "lawbotSnapshotSummary"
    | "lawbotSnapshotPayload"
  >
): StoredLawbotSnapshot | null {
  if (
    !inquiry.lawbotLastAnalyzedAt &&
    !inquiry.lawbotSnapshotStatus &&
    !inquiry.lawbotSnapshotSummary &&
    !inquiry.lawbotSnapshotPayload
  ) {
    return null;
  }

  let payload: StoredLawbotSnapshot["payload"] = null;

  if (inquiry.lawbotSnapshotPayload) {
    try {
      payload = JSON.parse(inquiry.lawbotSnapshotPayload) as StoredLawbotSnapshot["payload"];
    } catch {
      payload = null;
    }
  }

  return {
    analyzedAt: inquiry.lawbotLastAnalyzedAt?.toISOString() ?? null,
    version: inquiry.lawbotSnapshotVersion ?? 1,
    status: inquiry.lawbotSnapshotStatus ?? null,
    summary: inquiry.lawbotSnapshotSummary ?? null,
    payload
  };
}
