import { prisma } from "@/lib/prisma/client";
import {
  assertRequiredDocumentTransition,
  getAllowedRequiredDocumentTransitions
} from "@/lib/services/required-document-status-transition-helpers";
import { buildRequiredDocumentChecklistStarterPlan } from "@/lib/services/required-document-checklist-starter";

import {
  attachNextAction,
  getCaseMatterOperationalByIdTx,
  normalizeDocumentName,
  normalizeDocumentNameKey,
  normalizeExpectedUpdatedAt,
  parseOptionalDueDate,
  parseOptionalRequiredDocumentUpdateDueDate,
  sameOptionalDate
} from "./_internal";
import {
  CaseMatterConcurrentUpdateError,
  CaseMatterConversionError,
  RequiredDocumentConcurrentUpdateError,
  RequiredDocumentCreateError,
  RequiredDocumentStatusGuardError,
  RequiredDocumentUpdateError,
  type CreateRequiredDocumentInput,
  type StartRequiredDocumentChecklistInput,
  type StartRequiredDocumentChecklistResult,
  type UpdateRequiredDocumentMetadataInput,
  type UpdateRequiredDocumentStatusInput
} from "./case-matter-types";

export async function updateRequiredDocumentStatus(input: UpdateRequiredDocumentStatusInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.requiredDocument.findUnique({
      where: { id: input.requiredDocumentId },
      select: {
        id: true,
        caseId: true,
        name: true,
        status: true,
        updatedAt: true,
        requestedAt: true,
        receivedAt: true,
        reviewedAt: true
      }
    });

    if (!snapshot) {
      throw new RequiredDocumentUpdateError(
        "REQUIRED_DOCUMENT_NOT_FOUND",
        "Required document not found."
      );
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new RequiredDocumentUpdateError(
        "CASE_MATTER_MISMATCH",
        "Required document does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new RequiredDocumentConcurrentUpdateError(
        "Required document was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    if (snapshot.status !== input.status) {
      try {
        assertRequiredDocumentTransition(snapshot.status, input.status);
      } catch {
        const allowedTransitions = getAllowedRequiredDocumentTransitions(snapshot.status);
        throw new RequiredDocumentStatusGuardError(
          `Cannot change required document status from ${snapshot.status} to ${input.status}.`,
          [`Allowed next statuses: ${allowedTransitions.join(", ")}`]
        );
      }
    }

    const statusChangeNote = input.statusChangeNote?.trim() || null;
    const now = new Date();

    if (snapshot.status !== input.status) {
      await tx.requiredDocument.update({
        where: { id: snapshot.id },
        data: {
          status: input.status,
          requestedAt:
            input.status === "REQUESTED" ? snapshot.requestedAt ?? now : snapshot.requestedAt,
          receivedAt: input.status === "RECEIVED" ? snapshot.receivedAt ?? now : snapshot.receivedAt,
          reviewedAt:
            input.status === "IN_REVIEW" || input.status === "APPROVED" || input.status === "NEEDS_FIX"
              ? snapshot.reviewedAt ?? now
              : snapshot.reviewedAt
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.caseId,
          eventType: "REQUIRED_DOCUMENT_STATUS_CHANGED",
          actorName: input.actorName?.trim() || "system",
          message: statusChangeNote
            ? `Required document status changed: ${snapshot.name} (${snapshot.status} -> ${input.status}) (${statusChangeNote})`
            : `Required document status changed: ${snapshot.name} (${snapshot.status} -> ${input.status})`,
          payloadJson: JSON.stringify({
            requiredDocumentId: snapshot.id,
            requiredDocumentName: snapshot.name,
            previousStatus: snapshot.status,
            nextStatus: input.status,
            statusChangeNote
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.caseId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after required document status update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateRequiredDocumentMetadata(input: UpdateRequiredDocumentMetadataInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.requiredDocument.findUnique({
      where: { id: input.requiredDocumentId },
      select: {
        id: true,
        caseId: true,
        name: true,
        description: true,
        required: true,
        dueDate: true,
        updatedAt: true,
        caseMatter: {
          select: {
            updatedAt: true
          }
        }
      }
    });

    if (!snapshot) {
      throw new RequiredDocumentUpdateError(
        "REQUIRED_DOCUMENT_NOT_FOUND",
        "Required document not found."
      );
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new RequiredDocumentUpdateError(
        "CASE_MATTER_MISMATCH",
        "Required document does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new RequiredDocumentConcurrentUpdateError(
        "Required document was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
    if (
      expectedCaseUpdatedAt &&
      expectedCaseUpdatedAt.getTime() !== snapshot.caseMatter.updatedAt.getTime()
    ) {
      throw new CaseMatterConcurrentUpdateError(
        "Case matter was updated by another session. Reload and try again.",
        snapshot.caseMatter.updatedAt.toISOString()
      );
    }

    const name = normalizeDocumentName(input.name);
    if (!name) {
      throw new RequiredDocumentUpdateError(
        "REQUIRED_DOCUMENT_NAME_EMPTY",
        "Required document name must not be empty."
      );
    }

    if (normalizeDocumentNameKey(name) !== normalizeDocumentNameKey(snapshot.name)) {
      const existing = await tx.requiredDocument.findMany({
        where: {
          caseId: snapshot.caseId,
          id: {
            not: snapshot.id
          },
          status: {
            not: "NOT_APPLICABLE"
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      if (existing.some((item) => normalizeDocumentNameKey(item.name) === normalizeDocumentNameKey(name))) {
        throw new RequiredDocumentUpdateError(
          "REQUIRED_DOCUMENT_DUPLICATE",
          "A required document with the same name already exists for this case."
        );
      }
    }

    const description = input.description?.trim() || null;
    const dueDate = parseOptionalRequiredDocumentUpdateDueDate(input.dueDate);
    const changes: string[] = [];

    if (snapshot.name !== name) changes.push("name");
    if ((snapshot.description ?? null) !== description) changes.push("description");
    if (snapshot.required !== input.required) changes.push("required");
    if (!sameOptionalDate(snapshot.dueDate, dueDate)) changes.push("dueDate");

    if (changes.length > 0) {
      await tx.requiredDocument.update({
        where: { id: snapshot.id },
        data: {
          name,
          description,
          required: input.required,
          dueDate
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.caseId,
          eventType: "REQUIRED_DOCUMENT_METADATA_UPDATED",
          actorName: input.actorName?.trim() || "system",
          message: `Required document metadata updated: ${snapshot.name} (${changes.join(", ")})`,
          payloadJson: JSON.stringify({
            requiredDocumentId: snapshot.id,
            changedFields: changes,
            previous: {
              name: snapshot.name,
              description: snapshot.description,
              required: snapshot.required,
              dueDate: snapshot.dueDate?.toISOString() ?? null
            },
            next: {
              name,
              description,
              required: input.required,
              dueDate: dueDate?.toISOString() ?? null
            }
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.caseId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after required document metadata update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function createRequiredDocument(input: CreateRequiredDocumentInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new CaseMatterConversionError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
    if (expectedCaseUpdatedAt && expectedCaseUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseMatterConcurrentUpdateError(
        "Case matter was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const name = normalizeDocumentName(input.name);
    if (!name) {
      throw new RequiredDocumentCreateError(
        "REQUIRED_DOCUMENT_NAME_EMPTY",
        "Required document name must not be empty."
      );
    }

    const existing = await tx.requiredDocument.findFirst({
      where: {
        caseId: snapshot.id,
        name,
        status: {
          not: "NOT_APPLICABLE"
        }
      },
      select: {
        id: true
      }
    });

    if (existing) {
      throw new RequiredDocumentCreateError(
        "REQUIRED_DOCUMENT_DUPLICATE",
        "A required document with the same name already exists for this case."
      );
    }

    const dueDate = parseOptionalDueDate(input.dueDate);

    const created = await tx.requiredDocument.create({
      data: {
        caseId: snapshot.id,
        name,
        description: input.description?.trim() || null,
        required: input.required ?? true,
        status: "NEEDED",
        dueDate
      }
    });

    await tx.caseEvent.create({
      data: {
        caseId: snapshot.id,
        eventType: "REQUIRED_DOCUMENT_CREATED",
        actorName: input.actorName?.trim() || "system",
        message: `Required document created: ${created.name}`,
        payloadJson: JSON.stringify({
          requiredDocumentId: created.id,
          requiredDocumentName: created.name,
          required: created.required,
          dueDate: created.dueDate?.toISOString() ?? null
        })
      }
    });

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after required document creation."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function startRequiredDocumentChecklist(
  input: StartRequiredDocumentChecklistInput
): Promise<StartRequiredDocumentChecklistResult> {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        matterType: true,
        updatedAt: true,
        requiredDocuments: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    if (!snapshot) {
      throw new CaseMatterConversionError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
    if (expectedCaseUpdatedAt && expectedCaseUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseMatterConcurrentUpdateError(
        "Case matter was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const plan = buildRequiredDocumentChecklistStarterPlan(snapshot.matterType, snapshot.requiredDocuments);
    const { templates, toCreate } = plan;

    if (toCreate.length > 0) {
      await tx.requiredDocument.createMany({
        data: toCreate.map((item) => ({
          caseId: snapshot.id,
          name: item.name,
          description: item.description ?? null,
          required: item.required,
          status: "NEEDED"
        }))
      });
    }

    await tx.caseEvent.create({
      data: {
        caseId: snapshot.id,
        eventType: "REQUIRED_DOCUMENT_CHECKLIST_STARTED",
        actorName: input.actorName?.trim() || "system",
        message:
          toCreate.length > 0
            ? `Required document starter checklist created (${toCreate.length})`
            : "Required document starter checklist requested (no new items)",
        payloadJson: JSON.stringify({
          createdCount: toCreate.length,
          skippedCount: templates.length - toCreate.length,
          createdNames: toCreate.map((item) => item.name)
        })
      }
    });

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after checklist starter."
      );
    }

    return {
      caseMatter: attachNextAction(caseMatter),
      createdCount: toCreate.length,
      skippedCount: templates.length - toCreate.length
    };
  });
}
