import { prisma } from "@/lib/prisma/client";
import type { ForecastMetric, ForecastRunStatus } from "@generated/prisma-client/client";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type WeeklyForecastDatasetRow = {
  weekStartDate: Date;
  category: string;
  channel: string | null;
  inquiryCount: number;
  contractCount: number;
  avgProcessingDays: number | null;
  revisionRequestCount: number;
  externalIndicatorsJson: string;
  eventFlagsJson: string;
};

export type StoredForecastPoint = {
  targetWeekStart: Date;
  predictedValue: number;
  lowerBound?: number | null;
  upperBound?: number | null;
  actualValue?: number | null;
};

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getUtcWeekStart(date: Date) {
  const day = startOfUtcDay(date);
  const dayOfWeek = day.getUTCDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  day.setUTCDate(day.getUTCDate() + diff);
  return day;
}

function toWeekKey(date: Date) {
  return getUtcWeekStart(date).toISOString();
}

function toDatasetKey(weekStartDate: Date, category: string, channel: string | null) {
  return `${weekStartDate.toISOString()}::${category}::${channel ?? ""}`;
}

function safeAverage(total: number, count: number) {
  if (!count) return null;
  return Number((total / count).toFixed(2));
}

type MutableDatasetAccumulator = {
  weekStartDate: Date;
  category: string;
  channel: string | null;
  inquiryCount: number;
  contractCount: number;
  processingDayTotal: number;
  processingSampleCount: number;
  revisionRequestCount: number;
  externalIndicators: Record<string, number>;
  eventFlags: Array<{
    eventType: string;
    eventName: string;
    impactFlag: boolean;
    memo: string | null;
  }>;
};

function getAccumulator(
  collection: Map<string, MutableDatasetAccumulator>,
  weekStartDate: Date,
  category: string,
  channel: string | null
) {
  const key = toDatasetKey(weekStartDate, category, channel);
  const existing = collection.get(key);

  if (existing) {
    return existing;
  }

  const created: MutableDatasetAccumulator = {
    weekStartDate,
    category,
    channel,
    inquiryCount: 0,
    contractCount: 0,
    processingDayTotal: 0,
    processingSampleCount: 0,
    revisionRequestCount: 0,
    externalIndicators: {},
    eventFlags: []
  };

  collection.set(key, created);
  return created;
}

function mergeIndicatorValue(target: Record<string, number>, indicatorKey: string, numericValue: number) {
  target[indicatorKey] = numericValue;
}

function normalizeRows(rows: Map<string, MutableDatasetAccumulator>): WeeklyForecastDatasetRow[] {
  return Array.from(rows.values())
    .map((row) => ({
      weekStartDate: row.weekStartDate,
      category: row.category,
      channel: row.channel,
      inquiryCount: row.inquiryCount,
      contractCount: row.contractCount,
      avgProcessingDays: safeAverage(row.processingDayTotal, row.processingSampleCount),
      revisionRequestCount: row.revisionRequestCount,
      externalIndicatorsJson: JSON.stringify(row.externalIndicators),
      eventFlagsJson: JSON.stringify(row.eventFlags)
    }))
    .sort((left, right) => {
      if (left.weekStartDate.getTime() !== right.weekStartDate.getTime()) {
        return left.weekStartDate.getTime() - right.weekStartDate.getTime();
      }

      if (left.category !== right.category) {
        return left.category.localeCompare(right.category);
      }

      return (left.channel ?? "").localeCompare(right.channel ?? "");
    });
}

export async function buildWeeklyForecastDataset(): Promise<WeeklyForecastDatasetRow[]> {
  const [inquiries, acceptedQuotes, closedCases, supplements, indicators, eventFlags] = await Promise.all([
    prisma.inquiry.findMany({
      select: {
        createdAt: true,
        inquiryType: true,
        intakeSource: true
      }
    }),
    prisma.quote.findMany({
      where: {
        status: "ACCEPTED"
      },
      select: {
        createdAt: true,
        inquiry: {
          select: {
            inquiryType: true,
            intakeSource: true
          }
        }
      }
    }),
    prisma.caseRecord.findMany({
      where: {
        closedAt: {
          not: null
        }
      },
      select: {
        closedAt: true,
        inquiry: {
          select: {
            createdAt: true,
            inquiryType: true,
            intakeSource: true
          }
        }
      }
    }),
    prisma.supplementRequest.findMany({
      select: {
        requestedAt: true,
        case: {
          select: {
            inquiry: {
              select: {
                inquiryType: true,
                intakeSource: true
              }
            }
          }
        }
      }
    }),
    prisma.externalIndicatorObservation.findMany({
      orderBy: {
        observationDate: "asc"
      }
    }),
    prisma.forecastEventFlag.findMany({
      orderBy: {
        eventDate: "asc"
      }
    })
  ]);

  const rows = new Map<string, MutableDatasetAccumulator>();

  for (const inquiry of inquiries) {
    const weekStartDate = getUtcWeekStart(inquiry.createdAt);
    const row = getAccumulator(rows, weekStartDate, inquiry.inquiryType, inquiry.intakeSource ?? null);
    row.inquiryCount += 1;
  }

  for (const quote of acceptedQuotes) {
    const weekStartDate = getUtcWeekStart(quote.createdAt);
    const row = getAccumulator(
      rows,
      weekStartDate,
      quote.inquiry.inquiryType,
      quote.inquiry.intakeSource ?? null
    );
    row.contractCount += 1;
  }

  for (const record of closedCases) {
    if (!record.closedAt) continue;

    const weekStartDate = getUtcWeekStart(record.closedAt);
    const row = getAccumulator(
      rows,
      weekStartDate,
      record.inquiry.inquiryType,
      record.inquiry.intakeSource ?? null
    );
    const processingDays = Math.max(
      0,
      (startOfUtcDay(record.closedAt).getTime() - startOfUtcDay(record.inquiry.createdAt).getTime()) / DAY_IN_MS
    );
    row.processingDayTotal += processingDays;
    row.processingSampleCount += 1;
  }

  for (const supplement of supplements) {
    const weekStartDate = getUtcWeekStart(supplement.requestedAt);
    const row = getAccumulator(
      rows,
      weekStartDate,
      supplement.case.inquiry.inquiryType,
      supplement.case.inquiry.intakeSource ?? null
    );
    row.revisionRequestCount += 1;
  }

  for (const indicator of indicators) {
    const weekKey = toWeekKey(indicator.observationDate);

    for (const row of rows.values()) {
      if (toWeekKey(row.weekStartDate) !== weekKey) continue;
      if (indicator.category && indicator.category !== row.category) continue;
      mergeIndicatorValue(row.externalIndicators, indicator.indicatorKey, indicator.numericValue);
    }
  }

  for (const eventFlag of eventFlags) {
    const weekKey = toWeekKey(eventFlag.eventDate);

    for (const row of rows.values()) {
      if (toWeekKey(row.weekStartDate) !== weekKey) continue;
      if (eventFlag.category && eventFlag.category !== row.category) continue;

      row.eventFlags.push({
        eventType: eventFlag.eventType,
        eventName: eventFlag.eventName,
        impactFlag: eventFlag.impactFlag,
        memo: eventFlag.memo
      });
    }
  }

  return normalizeRows(rows);
}

export async function syncWeeklyForecastDataset() {
  const rows = await buildWeeklyForecastDataset();

  await prisma.$transaction([
    prisma.weeklyForecastDataset.deleteMany(),
    prisma.weeklyForecastDataset.createMany({
      data: rows
    })
  ]);

  return rows;
}

export function serializeWeeklyForecastDatasetCsv(rows: WeeklyForecastDatasetRow[]) {
  const header = [
    "weekStartDate",
    "category",
    "channel",
    "inquiryCount",
    "contractCount",
    "avgProcessingDays",
    "revisionRequestCount",
    "externalIndicatorsJson",
    "eventFlagsJson"
  ];

  const escapeCell = (value: string | number | null) => {
    if (value === null) return "";
    const stringValue = String(value);
    if (!/[",\n]/.test(stringValue)) return stringValue;
    return `"${stringValue.replaceAll('"', '""')}"`;
  };

  const lines = rows.map((row) =>
    [
      row.weekStartDate.toISOString().slice(0, 10),
      row.category,
      row.channel,
      row.inquiryCount,
      row.contractCount,
      row.avgProcessingDays,
      row.revisionRequestCount,
      row.externalIndicatorsJson,
      row.eventFlagsJson
    ]
      .map(escapeCell)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}

export async function storeDemandForecastRun(input: {
  targetMetric: ForecastMetric;
  targetCategory: string;
  targetChannel?: string | null;
  horizonWeeks: number;
  modelName: string;
  modelVersion?: string | null;
  sourceWindowWeeks: number;
  status?: ForecastRunStatus;
  contextJson?: string | null;
  note?: string | null;
  completedAt?: Date | null;
  points: StoredForecastPoint[];
}) {
  return prisma.demandForecastRun.create({
    data: {
      targetMetric: input.targetMetric,
      targetCategory: input.targetCategory,
      targetChannel: input.targetChannel ?? null,
      horizonWeeks: input.horizonWeeks,
      modelName: input.modelName,
      modelVersion: input.modelVersion ?? null,
      sourceWindowWeeks: input.sourceWindowWeeks,
      status: input.status ?? "COMPLETED",
      contextJson: input.contextJson ?? null,
      note: input.note ?? null,
      completedAt: input.completedAt ?? new Date(),
      points: {
        create: input.points.map((point) => ({
          targetWeekStart: point.targetWeekStart,
          predictedValue: point.predictedValue,
          lowerBound: point.lowerBound ?? null,
          upperBound: point.upperBound ?? null,
          actualValue: point.actualValue ?? null
        }))
      }
    },
    include: {
      points: {
        orderBy: {
          targetWeekStart: "asc"
        }
      }
    }
  });
}

export async function getLatestDemandForecastSummary() {
  const [datasetCount, latestDataset, latestRun] = await Promise.all([
    prisma.weeklyForecastDataset.count(),
    prisma.weeklyForecastDataset.findFirst({
      orderBy: {
        weekStartDate: "desc"
      }
    }),
    prisma.demandForecastRun.findFirst({
      where: {
        status: "COMPLETED"
      },
      include: {
        points: {
          orderBy: {
            targetWeekStart: "asc"
          },
          take: 8
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  ]);

  return {
    datasetCount,
    latestDatasetWeekStart: latestDataset?.weekStartDate ?? null,
    latestRun
  };
}
