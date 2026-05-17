import type { ImmigrationCaseDetail, Prisma } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import type { UpdateImmigrationCaseDetailPayload } from "@/lib/validation/case-matter";

type NullableDateField =
  | "dispositionDate"
  | "noticeDate"
  | "serviceDate"
  | "appealDeadline"
  | "departureDeadline"
  | "detentionStartDate"
  | "stayExpiryDate"
  | "submissionDeadline"
  | "supplementDeadline"
  | "resultExpectedDate"
  | "deadlineVerifiedAt";

type NullableStringField =
  | "dispositionType"
  | "nationality"
  | "currentStayStatus"
  | "familyInKoreaSummary"
  | "residenceBaseSummary"
  | "employmentOrSchoolSummary"
  | "violationHistorySummary"
  | "verifiedBy";

type BooleanField =
  | "scopeReviewRequired"
  | "attorneyScopeRisk"
  | "officialFormCheckRequired";

type ImmigrationCaseDetailWritableData = Partial<
  Record<NullableStringField, string | null> &
    Record<NullableDateField, Date | null> &
    Record<BooleanField, boolean>
>;

const dateFields: NullableDateField[] = [
  "dispositionDate",
  "noticeDate",
  "serviceDate",
  "appealDeadline",
  "departureDeadline",
  "detentionStartDate",
  "stayExpiryDate",
  "submissionDeadline",
  "supplementDeadline",
  "resultExpectedDate",
  "deadlineVerifiedAt"
];

const stringFields: NullableStringField[] = [
  "dispositionType",
  "nationality",
  "currentStayStatus",
  "familyInKoreaSummary",
  "residenceBaseSummary",
  "employmentOrSchoolSummary",
  "violationHistorySummary",
  "verifiedBy"
];

const booleanFields: BooleanField[] = [
  "scopeReviewRequired",
  "attorneyScopeRisk",
  "officialFormCheckRequired"
];

const auditValueFields = [
  "dispositionType",
  "nationality",
  "currentStayStatus",
  "verifiedBy",
  ...dateFields,
  ...booleanFields
] as const;

export type UpdateImmigrationCaseDetailInput = UpdateImmigrationCaseDetailPayload & {
  caseMatterId: string;
};

export class ImmigrationCaseDetailConcurrentUpdateError extends Error {
  currentUpdatedAt: string;

  constructor(message: string, currentUpdatedAt: string) {
    super(message);
    this.name = "ImmigrationCaseDetailConcurrentUpdateError";
    this.currentUpdatedAt = currentUpdatedAt;
  }
}

export class ImmigrationCaseDetailUpdateError extends Error {
  code:
    | "CASE_MATTER_NOT_FOUND"
    | "IMMIGRATION_CASE_DETAIL_NOT_FOUND"
    | "INVALID_DATE_FORMAT"
    | "SENSITIVE_FIELD_NOT_ALLOWED";

  constructor(code: ImmigrationCaseDetailUpdateError["code"], message: string) {
    super(message);
    this.name = "ImmigrationCaseDetailUpdateError";
    this.code = code;
  }
}

function normalizeExpectedUpdatedAt(raw?: string | null) {
  if (!raw?.trim()) return null;
  const expectedDate = new Date(raw);
  if (!Number.isFinite(expectedDate.getTime())) {
    throw new ImmigrationCaseDetailUpdateError(
      "INVALID_DATE_FORMAT",
      "Invalid expectedUpdatedAt format."
    );
  }
  return expectedDate;
}

function parseNullableDate(raw: string | null | undefined, field: string) {
  if (raw === undefined || raw === null || raw.trim() === "") return null;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new ImmigrationCaseDetailUpdateError(
      "INVALID_DATE_FORMAT",
      `Invalid ${field} format.`
    );
  }
  return parsed;
}

function normalizeNullableString(raw: string | null | undefined) {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function sameOptionalDate(a: Date | null, b: Date | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.getTime() === b.getTime();
}

function buildImmigrationCaseDetailData(input: UpdateImmigrationCaseDetailInput) {
  const data: ImmigrationCaseDetailWritableData = {};

  for (const field of stringFields) {
    if (input[field] !== undefined) {
      data[field] = normalizeNullableString(input[field]);
    }
  }

  for (const field of dateFields) {
    if (input[field] !== undefined) {
      data[field] = parseNullableDate(input[field], field);
    }
  }

  for (const field of booleanFields) {
    if (input[field] !== undefined) {
      data[field] = input[field];
    }
  }

  return data;
}

function collectChangedFields(
  existing: ImmigrationCaseDetail | null,
  data: ImmigrationCaseDetailWritableData
) {
  if (!existing) return Object.keys(data);

  const changes: string[] = [];
  for (const field of stringFields) {
    if (field in data && (existing[field] ?? null) !== (data[field] ?? null)) {
      changes.push(field);
    }
  }
  for (const field of dateFields) {
    if (field in data && !sameOptionalDate(existing[field] ?? null, (data[field] as Date | null) ?? null)) {
      changes.push(field);
    }
  }
  for (const field of booleanFields) {
    if (field in data && existing[field] !== data[field]) {
      changes.push(field);
    }
  }
  return changes;
}

function auditSnapshot(detail: ImmigrationCaseDetail | null) {
  if (!detail) return null;
  const snapshot: Record<string, string | boolean | null> = {};
  for (const field of auditValueFields) {
    const value = detail[field];
    snapshot[field] = value instanceof Date ? value.toISOString() : value ?? null;
  }
  return snapshot;
}

function auditNextSnapshot(data: ImmigrationCaseDetailWritableData) {
  const snapshot: Record<string, string | boolean | null> = {};
  for (const field of auditValueFields) {
    if (!(field in data)) continue;
    const value = data[field];
    snapshot[field] = value instanceof Date ? value.toISOString() : (value as string | boolean | null) ?? null;
  }
  return snapshot;
}

function buildAuditMessage(changedFields: string[]) {
  if (changedFields.length === 0) return "출입국 세부정보 변경 없음.";
  const coreDeadlineLabels: Record<string, string> = {
    serviceDate: "송달일",
    appealDeadline: "불복기한",
    departureDeadline: "출국기한",
    stayExpiryDate: "체류기간 만료일",
    supplementDeadline: "보완기한"
  };
  const changedLabels = changedFields
    .map((field) => coreDeadlineLabels[field] ?? null)
    .filter(Boolean);

  return changedLabels.length > 0
    ? `출입국 세부정보 업데이트: ${changedLabels.join(", ")} 변경`
    : "출입국 세부정보가 업데이트되었습니다.";
}

export async function updateImmigrationCaseDetail(input: UpdateImmigrationCaseDetailInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        updatedAt: true,
        immigrationDetail: true
      }
    });

    if (!snapshot) {
      throw new ImmigrationCaseDetailUpdateError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const existing = snapshot.immigrationDetail;
    if (existing) {
      const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
      if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== existing.updatedAt.getTime()) {
        throw new ImmigrationCaseDetailConcurrentUpdateError(
          "Immigration detail was updated by another session. Reload and try again.",
          existing.updatedAt.toISOString()
        );
      }
    } else {
      if (input.expectedUpdatedAt?.trim()) {
        throw new ImmigrationCaseDetailUpdateError(
          "IMMIGRATION_CASE_DETAIL_NOT_FOUND",
          "Immigration detail not found for expected update timestamp."
        );
      }
      const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
      if (expectedCaseUpdatedAt && expectedCaseUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
        throw new ImmigrationCaseDetailConcurrentUpdateError(
          "Case matter was updated by another session. Reload and try again.",
          snapshot.updatedAt.toISOString()
        );
      }
    }

    const data = buildImmigrationCaseDetailData(input);
    const changedFields = collectChangedFields(existing, data);

    if (changedFields.length > 0 || !existing) {
      const saved = existing
        ? await tx.immigrationCaseDetail.update({
            where: { id: existing.id },
            data: data satisfies Prisma.ImmigrationCaseDetailUncheckedUpdateInput
          })
        : await tx.immigrationCaseDetail.create({
            data: {
              caseId: snapshot.id,
              ...data
            }
          });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.id,
          eventType: "IMMIGRATION_CASE_DETAIL_UPDATED",
          actorName: input.actorName?.trim() || "system",
          message: buildAuditMessage(changedFields),
          payloadJson: JSON.stringify({
            immigrationCaseDetailId: saved.id,
            changedFields,
            dueDateSynced: false,
            previous: auditSnapshot(existing),
            next: auditNextSnapshot(data)
          })
        }
      });
    }

    return { ok: true };
  });
}
