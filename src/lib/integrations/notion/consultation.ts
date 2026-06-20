import { inquiryTypeLabels, type InquiryStatus, urgencyLabels } from "@/types/inquiry";

import {
  buildAdminReferenceUrl,
  buildDateProperty,
  buildRichText,
  buildSharedPageTitle,
  compactProperties,
  getConsultationDatabaseId,
  getNotionToken,
  upsertPage,
} from "./client";
import type { SyncConsultationInput } from "./types";

function mapConsultationStatus(status: InquiryStatus) {
  if (status === "NEW") return "신규";
  if (status === "ON_HOLD") return "자료요청";
  if (status === "WON" || status === "CLOSED" || status === "QUOTE_SENT") return "종결";
  return "검토중";
}

export function mapQualificationLabel(score: number) {
  if (score >= 75) return "높음";
  if (score >= 50) return "보통";
  return "낮음";
}

export function mapConversionLabel(status: InquiryStatus) {
  return status === "WON" || status === "CLOSED" ? "수임" : "미전환";
}

function buildConsultationBlocks(input: SyncConsultationInput) {
  const sections = [
    ["상담 요약", input.generatedSummary || "원문 명시 없음"],
    ["다음 액션", input.recommendedNextStep || "원문 명시 없음"],
    ["필요한 서류", input.recommendedDocuments?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"],
    ["진단 근거", input.classificationReason || "원문 명시 없음"],
    ["상담 주제 태그", input.serviceTags?.join(", ") || "원문 명시 없음"],
  ] as const;

  return sections.flatMap(([heading, body]) => [
    {
      object: "block",
      type: "heading_2",
      heading_2: { rich_text: buildRichText(heading) },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: buildRichText(body) },
    },
  ]);
}

function buildConsultationProperties(input: SyncConsultationInput) {
  const referenceUrl = input.referenceUrl ?? buildAdminReferenceUrl(input.inquiryId);
  const topicValues = [...new Set([inquiryTypeLabels[input.inquiryType].ko, ...(input.serviceTags ?? [])])];

  return compactProperties({
    이름: { title: buildRichText(buildSharedPageTitle(input.contactName, input.inquiryTitle)) },
    고객명: { rich_text: buildRichText(input.contactName) },
    연락처: input.contactPhone ? { phone_number: input.contactPhone } : undefined,
    상담채널: { select: { name: "웹접수" } },
    상담주제: topicValues.length > 0 ? { multi_select: topicValues.map((name) => ({ name })) } : undefined,
    상담요약: { rich_text: buildRichText(input.generatedSummary || "원문 명시 없음") },
    "필요한 서류": { rich_text: buildRichText(input.recommendedDocuments?.join(", ") || "원문 명시 없음") },
    "참고 자료 ": referenceUrl ? { url: referenceUrl } : undefined,
    "다음 액션": { rich_text: buildRichText(input.recommendedNextStep || "원문 명시 없음") },
    상태: { select: { name: mapConsultationStatus(input.inquiryStatus) } },
    수임가능성: { select: { name: mapQualificationLabel(input.qualificationScore) } },
    수임전환여부: { select: { name: mapConversionLabel(input.inquiryStatus) } },
    의뢰유형: { select: { name: inquiryTypeLabels[input.inquiryType].ko } },
    긴급도: { select: { name: urgencyLabels[input.urgencyLevel].ko } },
    비고: { rich_text: buildRichText(input.classificationReason || "자동 상담 기록 동기화") },
    상담일: buildDateProperty(input.createdAt ?? new Date().toISOString()),
    후속상담일: buildDateProperty(input.dueDate),
  });
}

export async function syncConsultationToNotion(input: SyncConsultationInput) {
  const token = getNotionToken();
  const consultationDatabaseId = getConsultationDatabaseId();

  if (!token || !consultationDatabaseId) {
    return { status: "disabled" as const, pageId: null };
  }

  const title = buildSharedPageTitle(input.contactName, input.inquiryTitle);
  const referenceUrl = input.referenceUrl ?? buildAdminReferenceUrl(input.inquiryId);

  return upsertPage({
    databaseId: consultationDatabaseId,
    token,
    title,
    fallbackUrl: { propertyName: "참고 자료 ", value: referenceUrl },
    properties: buildConsultationProperties({ ...input, referenceUrl }),
    children: buildConsultationBlocks(input),
  });
}
