import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  buildCaseMatterNotionSafeSummaryPayload,
  buildNotionExportDryRunResult,
  type NotionSafeExportErrorCode
} from "@/lib/notion";
import { prisma } from "@/lib/prisma/client";

const requestSchema = z
  .object({
    destination: z.literal("notion.case_management"),
    dryRun: z.literal(true),
    includeAdminUrl: z.boolean().optional().default(false)
  })
  .strict();

const caseMatterSelect = {
  id: true,
  caseNo: true,
  title: true,
  matterType: true,
  status: true,
  dueDate: true,
  assignedTo: true,
  summary: true,
  createdAt: true,
  updatedAt: true,
  inquiry: {
    select: {
      publicTrackingCode: true
    }
  }
} as const;

type SafeCaseMatterForNotionDryRun = {
  id: string;
  caseNo: string | null;
  title: string;
  matterType: string;
  status: string;
  dueDate: Date | null;
  assignedTo: string | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  inquiry: {
    publicTrackingCode: string | null;
  } | null;
};

type SafeErrorCode =
  | "INVALID_CASE_MATTER_ID"
  | "INVALID_JSON_BODY"
  | "INVALID_REQUEST"
  | "CASE_NOT_FOUND"
  | "CASE_NOT_SAFE_FOR_EXPORT"
  | NotionSafeExportErrorCode
  | "INTERNAL_ERROR";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawCaseMatterId } = await context.params;
  const caseMatterId = normalizeAdminEntityId(rawCaseMatterId);

  if (!caseMatterId) {
    return safeError(400, "INVALID_CASE_MATTER_ID");
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return safeError(400, "INVALID_JSON_BODY");
    }

    const payload = requestSchema.parse(bodyResult.body);
    const caseMatter = await prisma.caseMatter.findUnique({
      where: { id: caseMatterId },
      select: caseMatterSelect
    });

    if (!caseMatter) {
      return safeError(404, "CASE_NOT_FOUND");
    }

    if (!isSafeNotionExportQaCase(caseMatter)) {
      return safeError(403, "CASE_NOT_SAFE_FOR_EXPORT");
    }

    const safePayload = buildCaseMatterNotionSafeSummaryPayload({
      id: caseMatter.id,
      caseNo: caseMatter.caseNo,
      title: caseMatter.title,
      matterType: caseMatter.matterType,
      matterTypeLabel: caseMatter.matterType,
      status: String(caseMatter.status),
      dueDate: caseMatter.dueDate,
      assignedTo: caseMatter.assignedTo,
      createdAt: caseMatter.createdAt,
      updatedAt: caseMatter.updatedAt,
      sourceTrackingCode: caseMatter.inquiry?.publicTrackingCode ?? null,
      safeSummary: caseMatter.summary,
      adminCaseUrl: payload.includeAdminUrl ? `/admin/cases/${encodeURIComponent(caseMatter.id)}` : null
    });

    const dryRun = buildNotionExportDryRunResult({
      entityType: "case_matter",
      entityId: caseMatter.id,
      destination: payload.destination,
      payload: safePayload
    });

    if (!dryRun.ok) {
      return safeError(400, dryRun.errorCode, {
        exportedFieldKeys: dryRun.exportedFieldKeys,
        forbiddenFieldCheck: {
          ok: false,
          blockedKeys: dryRun.forbiddenFieldCheck.ok ? [] : dryRun.forbiddenFieldCheck.forbiddenKeys
        },
        missingOptionalFields: dryRun.missingOptionalFields,
        idempotencyKeyHashPresent: dryRun.idempotencyKeyHashPresent
      });
    }

    return safeJson({
      ok: true,
      dryRun: true,
      wouldWrite: false,
      destination: dryRun.destination,
      entityType: dryRun.entityType,
      exportedFieldKeys: dryRun.exportedFieldKeys,
      forbiddenFieldCheck: {
        ok: true,
        blockedKeys: []
      },
      idempotencyKeyHashPresent: dryRun.idempotencyKeyHashPresent,
      missingOptionalFields: dryRun.missingOptionalFields
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return safeError(400, "INVALID_REQUEST", {
        message: firstZodMessage(error, "Check request fields.")
      });
    }

    console.error("[admin.case-matters.notion-export.dry-run] failed", error instanceof Error ? error.name : "unknown");
    return safeError(500, "INTERNAL_ERROR");
  }
}

function isSafeNotionExportQaCase(caseMatter: Pick<SafeCaseMatterForNotionDryRun, "caseNo" | "title">): boolean {
  const haystack = `${caseMatter.caseNo ?? ""} ${caseMatter.title}`.toUpperCase();
  return haystack.includes("QA") || haystack.includes("NON_CUSTOMER");
}

function safeError(
  status: number,
  errorCode: SafeErrorCode,
  details?: {
    message?: string;
    exportedFieldKeys?: string[];
    forbiddenFieldCheck?: {
      ok: boolean;
      blockedKeys: string[];
    };
    missingOptionalFields?: string[];
    idempotencyKeyHashPresent?: boolean;
  }
) {
  return safeJson(
    {
      ok: false,
      dryRun: true,
      wouldWrite: false,
      errorCode,
      ...(details?.exportedFieldKeys ? { exportedFieldKeys: details.exportedFieldKeys } : {}),
      ...(details?.forbiddenFieldCheck ? { forbiddenFieldCheck: details.forbiddenFieldCheck } : {}),
      ...(details?.missingOptionalFields ? { missingOptionalFields: details.missingOptionalFields } : {}),
      ...(details?.idempotencyKeyHashPresent !== undefined
        ? { idempotencyKeyHashPresent: details.idempotencyKeyHashPresent }
        : {}),
      ...(details?.message ? { message: details.message } : {})
    },
    { status }
  );
}

function safeJson(payload: Record<string, unknown>, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(payload, {
    ...init,
    headers
  });
}
