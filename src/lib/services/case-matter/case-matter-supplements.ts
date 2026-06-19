import { prisma } from "@/lib/prisma/client";

import {
  attachNextAction,
  getCaseMatterOperationalByIdTx,
  normalizeExpectedUpdatedAt,
  normalizeSupplementTitle,
  parseOptionalSupplementUpdateDate,
  parseSupplementCreateDate,
  sameOptionalDate
} from "./_internal";
import {
  CaseMatterConcurrentUpdateError,
  CaseMatterConversionError,
  SupplementRequestConcurrentUpdateError,
  SupplementRequestCreateError,
  SupplementRequestUpdateError,
  type CreateSupplementRequestInput,
  type UpdateSupplementRequestMetadataInput,
  type UpdateSupplementRequestStatusInput
} from "./case-matter-types";

export async function createSupplementRequest(input: CreateSupplementRequestInput) {
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

    const title = normalizeSupplementTitle(input.title);
    if (!title) {
      throw new SupplementRequestCreateError(
        "SUPPLEMENT_REQUEST_TITLE_EMPTY",
        "Supplement request title must not be empty."
      );
    }

    const receivedAt = parseSupplementCreateDate(input.receivedAt, "receivedAt");
    const dueDate = parseSupplementCreateDate(input.dueDate, "dueDate");
    const created = await tx.supplementRequest.create({
      data: {
        caseId: snapshot.id,
        title,
        description: input.description?.trim() || null,
        receivedAt: receivedAt ?? new Date(),
        dueDate,
        requestedDocsJson: input.requestedDocsJson?.trim() || null,
        responseNote: input.responseNote?.trim() || null
      }
    });

    await tx.caseEvent.create({
      data: {
        caseId: snapshot.id,
        eventType: "SUPPLEMENT_REQUEST_CREATED",
        actorName: input.actorName?.trim() || "system",
        message: `Supplement request created: ${created.title}`,
        payloadJson: JSON.stringify({
          supplementRequestId: created.id,
          title: created.title,
          status: created.status,
          receivedAt: created.receivedAt.toISOString(),
          dueDate: created.dueDate?.toISOString() ?? null
        })
      }
    });

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after supplement request creation."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateSupplementRequestMetadata(input: UpdateSupplementRequestMetadataInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.supplementRequest.findUnique({
      where: { id: input.supplementRequestId },
      select: {
        id: true,
        caseId: true,
        title: true,
        description: true,
        receivedAt: true,
        dueDate: true,
        requestedDocsJson: true,
        responseNote: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new SupplementRequestUpdateError(
        "SUPPLEMENT_REQUEST_NOT_FOUND",
        "Supplement request not found."
      );
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new SupplementRequestUpdateError(
        "CASE_MATTER_MISMATCH",
        "Supplement request does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new SupplementRequestConcurrentUpdateError(
        "Supplement request was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const title = normalizeSupplementTitle(input.title);
    if (!title) {
      throw new SupplementRequestUpdateError(
        "SUPPLEMENT_REQUEST_TITLE_EMPTY",
        "Supplement request title must not be empty."
      );
    }

    const description = input.description?.trim() || null;
    const receivedAt =
      parseOptionalSupplementUpdateDate(input.receivedAt, "receivedAt") ?? snapshot.receivedAt;
    const dueDate = parseOptionalSupplementUpdateDate(input.dueDate, "dueDate");
    const requestedDocsJson = input.requestedDocsJson?.trim() || null;
    const responseNote = input.responseNote?.trim() || null;
    const changes: string[] = [];

    if (snapshot.title !== title) changes.push("title");
    if ((snapshot.description ?? null) !== description) changes.push("description");
    if (!sameOptionalDate(snapshot.receivedAt, receivedAt)) changes.push("receivedAt");
    if (!sameOptionalDate(snapshot.dueDate, dueDate)) changes.push("dueDate");
    if ((snapshot.requestedDocsJson ?? null) !== requestedDocsJson) changes.push("requestedDocsJson");
    if ((snapshot.responseNote ?? null) !== responseNote) changes.push("responseNote");

    if (changes.length > 0) {
      await tx.supplementRequest.update({
        where: { id: snapshot.id },
        data: {
          title,
          description,
          receivedAt,
          dueDate,
          requestedDocsJson,
          responseNote
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.caseId,
          eventType: "SUPPLEMENT_REQUEST_METADATA_UPDATED",
          actorName: input.actorName?.trim() || "system",
          message: `Supplement request metadata updated: ${snapshot.title} (${changes.join(", ")})`,
          payloadJson: JSON.stringify({
            supplementRequestId: snapshot.id,
            changedFields: changes,
            previous: {
              title: snapshot.title,
              description: snapshot.description,
              receivedAt: snapshot.receivedAt.toISOString(),
              dueDate: snapshot.dueDate?.toISOString() ?? null,
              requestedDocsJson: snapshot.requestedDocsJson,
              responseNote: snapshot.responseNote
            },
            next: {
              title,
              description,
              receivedAt: receivedAt.toISOString(),
              dueDate: dueDate?.toISOString() ?? null,
              requestedDocsJson,
              responseNote
            }
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.caseId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after supplement request metadata update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateSupplementRequestStatus(input: UpdateSupplementRequestStatusInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.supplementRequest.findUnique({
      where: { id: input.supplementRequestId },
      select: {
        id: true,
        caseId: true,
        title: true,
        status: true,
        responseNote: true,
        respondedAt: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new SupplementRequestUpdateError(
        "SUPPLEMENT_REQUEST_NOT_FOUND",
        "Supplement request not found."
      );
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new SupplementRequestUpdateError(
        "CASE_MATTER_MISMATCH",
        "Supplement request does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new SupplementRequestConcurrentUpdateError(
        "Supplement request was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const statusChangeNote = input.statusChangeNote?.trim() || null;
    const responseNote =
      input.responseNote === undefined || input.responseNote === null
        ? snapshot.responseNote ?? null
        : input.responseNote.trim() || null;
    const terminalWithResponse = input.status === "RESPONDED" || input.status === "CLOSED";
    const explicitRespondedAt = parseOptionalSupplementUpdateDate(input.respondedAt, "respondedAt");
    const nextRespondedAt = terminalWithResponse ? explicitRespondedAt ?? snapshot.respondedAt ?? new Date() : null;
    const changes: string[] = [];

    if (snapshot.status !== input.status) changes.push("status");
    if ((snapshot.responseNote ?? null) !== responseNote) changes.push("responseNote");
    if (!sameOptionalDate(snapshot.respondedAt, nextRespondedAt)) changes.push("respondedAt");

    if (changes.length > 0) {
      await tx.supplementRequest.update({
        where: { id: snapshot.id },
        data: {
          status: input.status,
          responseNote,
          respondedAt: nextRespondedAt
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.caseId,
          eventType: "SUPPLEMENT_REQUEST_STATUS_CHANGED",
          actorName: input.actorName?.trim() || "system",
          message: statusChangeNote
            ? `Supplement request status changed: ${snapshot.title} (${snapshot.status} -> ${input.status}) (${statusChangeNote})`
            : `Supplement request status changed: ${snapshot.title} (${snapshot.status} -> ${input.status})`,
          payloadJson: JSON.stringify({
            supplementRequestId: snapshot.id,
            title: snapshot.title,
            previousStatus: snapshot.status,
            nextStatus: input.status,
            responseNote,
            respondedAt: nextRespondedAt?.toISOString() ?? null,
            statusChangeNote
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.caseId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after supplement request status update."
      );
    }

    return attachNextAction(caseMatter);
  });
}
