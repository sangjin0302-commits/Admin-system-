import {
  buildNotionExportIdempotencyKey,
  hashNotionExportIdempotencyKey,
  NOTION_CASE_MATTER_SAFE_EXPORT_FIELDS,
  scanNotionExportForbiddenFields,
  type CaseMatterNotionSafeSummaryPayload,
  type NotionExportDestination,
  type NotionExportEntityType,
  type NotionForbiddenExportField,
  type NotionSafeExportErrorCode
} from "./notion-export-allowlist";

export type NotionExportDryRunInput = {
  entityType: NotionExportEntityType;
  entityId: string;
  destination: NotionExportDestination;
  payload: CaseMatterNotionSafeSummaryPayload | Record<string, unknown>;
};

export type NotionExportForbiddenFieldCheckViewModel =
  | {
      ok: true;
      forbiddenKeys: [];
    }
  | {
      ok: false;
      forbiddenKeys: NotionForbiddenExportField[];
    };

export type NotionExportDryRunResult =
  | {
      ok: true;
      destination: NotionExportDestination;
      entityType: NotionExportEntityType;
      exportedFieldKeys: string[];
      forbiddenFieldCheck: NotionExportForbiddenFieldCheckViewModel;
      idempotencyKeyHashPresent: true;
      idempotencyKeyHash: string;
      wouldWrite: false;
      missingOptionalFields: string[];
    }
  | {
      ok: false;
      destination: NotionExportDestination;
      entityType: NotionExportEntityType;
      exportedFieldKeys: string[];
      forbiddenFieldCheck: NotionExportForbiddenFieldCheckViewModel;
      idempotencyKeyHashPresent: true;
      idempotencyKeyHash: string;
      wouldWrite: false;
      missingOptionalFields: string[];
      errorCode: NotionSafeExportErrorCode;
    };

export function buildNotionExportDryRunResult(input: NotionExportDryRunInput): NotionExportDryRunResult {
  const forbiddenScan = scanNotionExportForbiddenFields(input.payload);
  const exportedFieldKeys = getExportedFieldKeys(input.payload);
  const missingOptionalFields = NOTION_CASE_MATTER_SAFE_EXPORT_FIELDS.filter(
    (field) => !exportedFieldKeys.includes(field)
  );
  const idempotencyKey = buildNotionExportIdempotencyKey({
    entityType: input.entityType,
    entityId: input.entityId,
    destination: input.destination
  });
  const idempotencyKeyHash = hashNotionExportIdempotencyKey(idempotencyKey);

  if (!forbiddenScan.ok) {
    return {
      ok: false,
      destination: input.destination,
      entityType: input.entityType,
      exportedFieldKeys,
      forbiddenFieldCheck: {
        ok: false,
        forbiddenKeys: forbiddenScan.forbiddenKeys
      },
      idempotencyKeyHashPresent: true,
      idempotencyKeyHash,
      wouldWrite: false,
      missingOptionalFields,
      errorCode: forbiddenScan.errorCode
    };
  }

  return {
    ok: true,
    destination: input.destination,
    entityType: input.entityType,
    exportedFieldKeys,
    forbiddenFieldCheck: {
      ok: true,
      forbiddenKeys: []
    },
    idempotencyKeyHashPresent: true,
    idempotencyKeyHash,
    wouldWrite: false,
    missingOptionalFields
  };
}

function getExportedFieldKeys(payload: CaseMatterNotionSafeSummaryPayload | Record<string, unknown>): string[] {
  if ("fields" in payload && payload.fields && typeof payload.fields === "object" && !Array.isArray(payload.fields)) {
    return Object.keys(payload.fields).sort();
  }

  return Object.keys(payload).sort();
}
