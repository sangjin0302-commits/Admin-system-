import type { InquiryType } from "@/types/inquiry";

import {
  getNotionToken,
  getReferenceArchiveDatabaseId,
  getReferenceWebsiteDatabaseId,
  notionRequest,
} from "./client";
import type {
  NotionReferenceMaterial,
  NotionReferenceRecommendations,
  NotionReferenceWebsite,
} from "./types";

function readPlainTextProperty(property: any): string | null {
  if (!property) return null;

  if (property.type === "title" || property.type === "rich_text") {
    const items = property[property.type] ?? [];
    return items.map((item: any) => item?.plain_text ?? "").join("").trim() || null;
  }

  if (property.type === "select") {
    return property.select?.name ?? null;
  }

  if (property.type === "url") {
    return property.url ?? null;
  }

  if (property.type === "number") {
    return typeof property.number === "number" ? String(property.number) : null;
  }

  return null;
}

function readMultiSelectNames(property: any): string[] {
  if (!property?.multi_select) return [];
  return property.multi_select.map((item: any) => item?.name).filter(Boolean);
}

function readTitle(propertyMap: Record<string, any>, key: string) {
  return readPlainTextProperty(propertyMap[key]) ?? "제목 없음";
}

function buildReferenceKeywords(input: {
  inquiryType: InquiryType;
  serviceTags?: string[];
  inquiryTitle?: string;
}) {
  const baseMap: Record<InquiryType, string[]> = {
    FOREIGNER_VISA: ["비자", "출입국", "행정사"],
    IMMIGRATION_STAY: ["출입국", "비자", "행정사"],
    APOSTILLE_CONSULAR: ["행정사", "계약", "일반"],
    TRANSLATION_NOTARY: ["행정사", "계약", "일반"],
    GENERAL_ADMIN_CIVIL: ["민원", "행정사", "일반"],
    CORPORATE_REQUEST: ["기업행정", "계약", "행정사"],
    UNKNOWN: ["행정사", "일반"],
  };

  const extractedTitleKeywords = (input.inquiryTitle ?? "")
    .split(/[\s,·/()]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .slice(0, 6);

  return [...new Set([...(baseMap[input.inquiryType] ?? []), ...(input.serviceTags ?? []), ...extractedTitleKeywords])];
}

function scoreTextAgainstKeywords(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.reduce((score, keyword) => {
    const token = keyword.toLowerCase();
    return normalized.includes(token) ? score + 1 : score;
  }, 0);
}

export async function getNotionReferenceRecommendations(input: {
  inquiryType: InquiryType;
  serviceTags?: string[];
  inquiryTitle?: string;
}) {
  const token = getNotionToken();
  const archiveDatabaseId = getReferenceArchiveDatabaseId();
  const websiteDatabaseId = getReferenceWebsiteDatabaseId();

  if (!token || (!archiveDatabaseId && !websiteDatabaseId)) {
    return {
      keywords: buildReferenceKeywords(input),
      materials: [],
      websites: [],
    } satisfies NotionReferenceRecommendations;
  }

  const keywords = buildReferenceKeywords(input);

  let archivePayload: unknown = { results: [] };
  let websitePayload: unknown = { results: [] };

  try {
    [archivePayload, websitePayload] = await Promise.all([
      archiveDatabaseId
        ? notionRequest(`/databases/${archiveDatabaseId}/query`, {
            method: "POST",
            body: JSON.stringify({ page_size: 50 }),
          }, token)
        : Promise.resolve({ results: [] }),
      websiteDatabaseId
        ? notionRequest(`/databases/${websiteDatabaseId}/query`, {
            method: "POST",
            body: JSON.stringify({ page_size: 50 }),
          }, token)
        : Promise.resolve({ results: [] }),
    ]);
  } catch (error) {
    console.error("Failed to load Notion reference recommendations", error);
    return {
      keywords,
      materials: [],
      websites: [],
    } satisfies NotionReferenceRecommendations;
  }

  const materials = ((archivePayload as any).results ?? [])
    .map((page: any) => {
      const properties = page.properties ?? {};
      const title = readTitle(properties, "자료 제목");
      const category = readPlainTextProperty(properties["분야"]);
      const resourceType = readPlainTextProperty(properties["종류"]);
      const summary = readPlainTextProperty(properties["주요내용 요약"]);
      const source = readPlainTextProperty(properties["출처"]);
      const citationUrl = readPlainTextProperty(properties["PDF/Citation"]);
      const status = readPlainTextProperty(properties["요약여부"]);
      const yearValue = readPlainTextProperty(properties["출판연도"]);
      const publishedYear = yearValue ? Number(yearValue) : null;
      const score =
        (category && keywords.includes(category) ? 8 : 0) +
        (status === "완료" ? 4 : 0) +
        scoreTextAgainstKeywords([title, summary, source, category, resourceType].filter(Boolean).join(" "), keywords) * 2;

      return {
        id: page.id,
        title,
        category,
        resourceType,
        summary,
        source,
        citationUrl,
        publishedYear: Number.isFinite(publishedYear) ? publishedYear : null,
        status,
        score,
      } satisfies NotionReferenceMaterial;
    })
    .filter((item: NotionReferenceMaterial) => item.score > 0)
    .sort((left: NotionReferenceMaterial, right: NotionReferenceMaterial) => right.score - left.score || (right.publishedYear ?? 0) - (left.publishedYear ?? 0))
    .slice(0, 4);

  const websites = ((websitePayload as any).results ?? [])
    .map((page: any) => {
      const properties = page.properties ?? {};
      const title = readTitle(properties, "이름");
      const organization = readPlainTextProperty(properties["관련 기관"]);
      const fields = readMultiSelectNames(properties["분야"]);
      const description = readPlainTextProperty(properties["용도 설명"]);
      const url = readPlainTextProperty(properties["URL"]) ?? readPlainTextProperty(properties["userDefined:URL"]);
      const score =
        fields.reduce((sum, field) => sum + (keywords.includes(field) ? 8 : 0), 0) +
        scoreTextAgainstKeywords([title, organization, description, ...fields].filter(Boolean).join(" "), keywords) * 2;

      return {
        id: page.id,
        title,
        organization,
        fields,
        description,
        url,
        score,
      } satisfies NotionReferenceWebsite;
    })
    .filter((item: NotionReferenceWebsite) => item.score > 0)
    .sort((left: NotionReferenceWebsite, right: NotionReferenceWebsite) => right.score - left.score)
    .slice(0, 5);

  return {
    keywords,
    materials,
    websites,
  } satisfies NotionReferenceRecommendations;
}
