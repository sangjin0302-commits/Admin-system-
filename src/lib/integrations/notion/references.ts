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
import { logger } from "@/lib/utils/logger";

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

function readCheckbox(property: any): boolean {
  return property?.type === "checkbox" ? Boolean(property.checkbox) : false;
}

function readDateStart(property: any): string | null {
  return property?.type === "date" ? (property.date?.start ?? null) : null;
}

function readStatusName(property: any): string | null {
  return property?.type === "status" ? (property.status?.name ?? null) : null;
}

/** 노션 "핵심 키워드" 텍스트를 토큰으로 분리합니다. */
function splitKeywordText(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,·/|、\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function readTitle(propertyMap: Record<string, any>, key: string) {
  return readPlainTextProperty(propertyMap[key]) ?? "제목 없음";
}

/** 노션 "자료 활용 상태" 중 이 값만 추천 대상입니다. (미검토·검증 필요·사용 보류 제외) */
const ARCHIVE_USAGE_STATUS_READY = "Lawbot 연결 가능";

/** 문의 유형 → 노션 "적용 도메인" 선택지 매핑. */
const INQUIRY_DOMAIN_MAP: Record<InquiryType, string[]> = {
  FOREIGNER_VISA: ["비자/출입국"],
  IMMIGRATION_STAY: ["비자/출입국"],
  APOSTILLE_CONSULAR: ["공통 실무", "민원서류"],
  TRANSLATION_NOTARY: ["공통 실무", "민원서류"],
  GENERAL_ADMIN_CIVIL: ["기타 행정", "민원서류", "공통 실무"],
  CORPORATE_REQUEST: ["법인설립", "인허가"],
  UNKNOWN: [],
};

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

/**
 * 노션 DB 전체를 커서로 끝까지 읽습니다.
 * (page_size 상한이 100이라 단발 조회는 그 뒤 행을 조용히 버립니다.)
 */
async function queryAllPages(
  databaseId: string,
  token: string,
  body: Record<string, unknown> = {}
): Promise<any[]> {
  const rows: any[] = [];
  let cursor: string | undefined;

  // 폭주 방지: 최대 10페이지(=1000행)까지만 읽습니다.
  for (let page = 0; page < 10; page += 1) {
    const payload: any = await notionRequest(
      `/databases/${databaseId}/query`,
      {
        method: "POST",
        body: JSON.stringify({ ...body, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
      },
      token
    );
    rows.push(...(payload?.results ?? []));
    if (!payload?.has_more || !payload?.next_cursor) return rows;
    cursor = payload.next_cursor;
  }

  logger.warn("[notion] 참고자료 DB가 1000행을 넘어 일부만 읽었습니다", { databaseId });
  return rows;
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

  const domains = INQUIRY_DOMAIN_MAP[input.inquiryType] ?? [];

  let archiveRows: any[] = [];
  let websiteRows: any[] = [];

  try {
    [archiveRows, websiteRows] = await Promise.all([
      archiveDatabaseId
        ? // 큐레이션이 끝난 자료만 조회합니다. 미검토·검증 필요·사용 보류는 서버에서 걸러집니다.
          queryAllPages(archiveDatabaseId, token, {
            filter: {
              property: "자료 활용 상태",
              select: { equals: ARCHIVE_USAGE_STATUS_READY },
            },
          })
        : Promise.resolve([]),
      websiteDatabaseId ? queryAllPages(websiteDatabaseId, token) : Promise.resolve([]),
    ]);
  } catch (error) {
    logger.error("Failed to load Notion reference recommendations", error);
    return {
      keywords,
      materials: [],
      websites: [],
    } satisfies NotionReferenceRecommendations;
  }

  const materials = archiveRows
    .map((page: any) => {
      const properties = page.properties ?? {};
      const title = readTitle(properties, "자료 제목");
      const category = readPlainTextProperty(properties["분야"]);
      const resourceType = readPlainTextProperty(properties["종류"]);
      const summary = readPlainTextProperty(properties["주요내용 요약"]);
      const source = readPlainTextProperty(properties["출처"]);
      const citationUrl = readPlainTextProperty(properties["PDF/Citation"]);
      const status = readStatusName(properties["요약여부"]);
      const yearValue = readPlainTextProperty(properties["출판연도"]);
      const publishedYear = yearValue ? Number(yearValue) : null;

      const usageStatus = readPlainTextProperty(properties["자료 활용 상태"]);
      const sourceGrade = readPlainTextProperty(properties["출처 등급"]);
      const trustLevel = readPlainTextProperty(properties["자료 신뢰도"]);
      const lawReferences = readPlainTextProperty(properties["관련 법령/조문"]);
      const materialKeywords = splitKeywordText(readPlainTextProperty(properties["핵심 키워드"]));
      const materialDomains = readMultiSelectNames(properties["적용 도메인"]);
      const subTypes = readMultiSelectNames(properties["세부 유형"]);
      const usageSites = readMultiSelectNames(properties["사용 위치"]);
      const reviewedAt = readDateStart(properties["최신성 검토일"]);
      const mustVerify = sourceGrade === "must_verify" || usageSites.includes("must_verify");
      const clientVisible = readCheckbox(properties["고객 노출 가능"]);

      // 노션에 직접 적어둔 키워드·법령·도메인을 가장 높게 칩니다.
      const domainScore = materialDomains.reduce(
        (sum, domain) => sum + (domains.includes(domain) ? 10 : 0),
        0
      );
      const curatedKeywordScore =
        scoreTextAgainstKeywords(materialKeywords.join(" "), keywords) * 4 +
        scoreTextAgainstKeywords(lawReferences ?? "", keywords) * 4 +
        scoreTextAgainstKeywords(subTypes.join(" "), keywords) * 3;
      const trustScore = trustLevel === "공식" ? 3 : trustLevel === "준공식" ? 2 : 0;
      const score =
        domainScore +
        curatedKeywordScore +
        trustScore +
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
        usageStatus,
        sourceGrade,
        trustLevel,
        lawReferences,
        keywords: materialKeywords,
        domains: materialDomains,
        usageSites,
        reviewedAt,
        mustVerify,
        clientVisible,
        score,
      } satisfies NotionReferenceMaterial;
    })
    .filter((item: NotionReferenceMaterial) => item.score > 0)
    .sort((left: NotionReferenceMaterial, right: NotionReferenceMaterial) => right.score - left.score || (right.publishedYear ?? 0) - (left.publishedYear ?? 0))
    .slice(0, 4);

  const websites = websiteRows
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
