import type { Prisma } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import { sanitizeIntakeTrackingText } from "@/lib/services/intake-source-tracking";

export type IntakeSourceAnalyticsFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  source?: string;
  channel?: string;
  practiceArea?: string;
  contentId?: string;
  packageId?: string;
};

export type IntakeSourceAnalyticsRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  contactName: string;
  publicTrackingCode: string | null;
  intakeSource: string | null;
  intakeChannel: string | null;
  intakePracticeArea: string | null;
  intakeContentId: string | null;
  intakePackageId: string | null;
};

export type IntakeSourceAggregateRow = {
  key: string;
  label: string;
  count: number;
};

export type IntakeSourceContentAggregateRow = {
  contentId: string;
  channel: string;
  practiceArea: string;
  count: number;
};

export type IntakeSourceRecentItem = {
  createdAt: string;
  contactName: string;
  source: string;
  channel: string;
  practiceArea: string;
  contentId: string;
  packageId: string;
  publicTrackingCode: string;
  detailHref: string;
};

export type IntakeSourceAnalytics = {
  summary: {
    totalCount: number;
    trackedCount: number;
    autosnsCount: number;
    untrackedCount: number;
    recent7DayCount: number;
    recent30DayCount: number;
  };
  sourceCounts: IntakeSourceAggregateRow[];
  channelCounts: IntakeSourceAggregateRow[];
  practiceAreaCounts: IntakeSourceAggregateRow[];
  contentCounts: IntakeSourceContentAggregateRow[];
  packageCounts: IntakeSourceAggregateRow[];
  recentItems: IntakeSourceRecentItem[];
};

type RawParams = Record<string, string | string[] | undefined>;

const EMPTY_LABEL = "데이터 없음";
const RECENT_ITEM_LIMIT = 25;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseDateParam(value: string | undefined, endOfDay = false) {
  const sanitized = sanitizeIntakeTrackingText(value);
  if (!sanitized) return undefined;
  const date = new Date(sanitized);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(sanitized)) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function safeText(value: unknown, fallback = "") {
  return sanitizeIntakeTrackingText(value) ?? fallback;
}

function normalizeKey(value: unknown) {
  return safeText(value, EMPTY_LABEL) || EMPTY_LABEL;
}

function hasTracking(record: IntakeSourceAnalyticsRecord) {
  return Boolean(
    (record.intakeSource && record.intakeSource !== "website") ||
      record.intakeChannel ||
      record.intakePracticeArea ||
      record.intakeContentId ||
      record.intakePackageId
  );
}

function countBy(
  records: IntakeSourceAnalyticsRecord[],
  selector: (record: IntakeSourceAnalyticsRecord) => unknown
) {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = normalizeKey(selector(record));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ key: label, label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function countContent(records: IntakeSourceAnalyticsRecord[]) {
  const counts = new Map<string, IntakeSourceContentAggregateRow>();
  for (const record of records) {
    const contentId = normalizeKey(record.intakeContentId);
    const channel = normalizeKey(record.intakeChannel);
    const practiceArea = normalizeKey(record.intakePracticeArea);
    const key = `${contentId}\u0000${channel}\u0000${practiceArea}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { contentId, channel, practiceArea, count: 1 });
    }
  }

  return [...counts.values()].sort(
    (a, b) =>
      b.count - a.count ||
      a.contentId.localeCompare(b.contentId) ||
      a.channel.localeCompare(b.channel)
  );
}

export function parseIntakeSourceAnalyticsFilters(params: RawParams): IntakeSourceAnalyticsFilters {
  return {
    dateFrom: parseDateParam(firstParam(params.dateFrom)),
    dateTo: parseDateParam(firstParam(params.dateTo), true),
    source: safeText(firstParam(params.source)) || undefined,
    channel: safeText(firstParam(params.channel)) || undefined,
    practiceArea: safeText(firstParam(params.practice_area)) || undefined,
    contentId: safeText(firstParam(params.content_id)) || undefined,
    packageId: safeText(firstParam(params.package_id)) || undefined
  };
}

export function buildIntakeSourceAnalyticsWhere(
  filters: IntakeSourceAnalyticsFilters
): Prisma.InquiryWhereInput {
  return {
    ...(filters.dateFrom || filters.dateTo
      ? {
          createdAt: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {})
          }
        }
      : {}),
    ...(filters.source ? { intakeSource: filters.source } : {}),
    ...(filters.channel ? { intakeChannel: filters.channel } : {}),
    ...(filters.practiceArea ? { intakePracticeArea: filters.practiceArea } : {}),
    ...(filters.contentId ? { intakeContentId: filters.contentId } : {}),
    ...(filters.packageId ? { intakePackageId: filters.packageId } : {})
  };
}

export function buildIntakeSourceAnalytics(
  records: IntakeSourceAnalyticsRecord[],
  now = new Date()
): IntakeSourceAnalytics {
  const recent7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recent30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const trackedRecords = records.filter(hasTracking);

  return {
    summary: {
      totalCount: records.length,
      trackedCount: trackedRecords.length,
      autosnsCount: records.filter((record) => safeText(record.intakeSource).toLowerCase() === "autosns").length,
      untrackedCount: records.length - trackedRecords.length,
      recent7DayCount: records.filter((record) => record.createdAt >= recent7Start).length,
      recent30DayCount: records.filter((record) => record.createdAt >= recent30Start).length
    },
    sourceCounts: countBy(records, (record) => record.intakeSource),
    channelCounts: countBy(records, (record) => record.intakeChannel),
    practiceAreaCounts: countBy(records, (record) => record.intakePracticeArea),
    contentCounts: countContent(records),
    packageCounts: countBy(records, (record) => record.intakePackageId),
    recentItems: records
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, RECENT_ITEM_LIMIT)
      .map((record) => ({
        createdAt: record.createdAt.toISOString(),
        contactName: safeText(record.contactName, "-"),
        source: safeText(record.intakeSource, EMPTY_LABEL),
        channel: safeText(record.intakeChannel, EMPTY_LABEL),
        practiceArea: safeText(record.intakePracticeArea, EMPTY_LABEL),
        contentId: safeText(record.intakeContentId, EMPTY_LABEL),
        packageId: safeText(record.intakePackageId, EMPTY_LABEL),
        publicTrackingCode: safeText(record.publicTrackingCode, "-"),
        detailHref: `/admin/inquiries/${encodeURIComponent(record.id)}`
      }))
  };
}

export async function getAdminIntakeSourceAnalytics(
  filters: IntakeSourceAnalyticsFilters
) {
  const records = await prisma.inquiry.findMany({
    where: buildIntakeSourceAnalyticsWhere(filters),
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      contactName: true,
      publicTrackingCode: true,
      intakeSource: true,
      intakeChannel: true,
      intakePracticeArea: true,
      intakeContentId: true,
      intakePackageId: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return buildIntakeSourceAnalytics(records);
}
