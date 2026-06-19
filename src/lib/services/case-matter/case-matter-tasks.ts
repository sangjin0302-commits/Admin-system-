import { prisma } from "@/lib/prisma/client";

import {
  attachNextAction,
  getCaseMatterOperationalByIdTx,
  normalizeExpectedUpdatedAt,
  normalizeTaskTitle,
  parseOptionalCaseTaskCreateDueDate,
  parseOptionalCaseTaskUpdateDueDate,
  sameOptionalDate
} from "./_internal";
import {
  CaseMatterConcurrentUpdateError,
  CaseMatterConversionError,
  CaseTaskConcurrentUpdateError,
  CaseTaskCreateError,
  CaseTaskUpdateError,
  type CreateCaseTaskInput,
  type UpdateCaseTaskMetadataInput,
  type UpdateCaseTaskStatusInput
} from "./case-matter-types";

export async function createCaseTask(input: CreateCaseTaskInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        inquiryId: true,
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

    const title = normalizeTaskTitle(input.title);
    if (!title) {
      throw new CaseTaskCreateError("CASE_TASK_TITLE_EMPTY", "Case task title must not be empty.");
    }

    const dueDate = parseOptionalCaseTaskCreateDueDate(input.dueDate);
    const created = await tx.caseTask.create({
      data: {
        caseId: snapshot.id,
        inquiryId: snapshot.inquiryId,
        title,
        details: input.details?.trim() || null,
        description: input.description?.trim() || null,
        status: input.status ?? "TODO",
        priority: input.priority ?? "NORMAL",
        dueDate,
        assignedTo: input.assignedTo?.trim() || null,
        completedAt: input.status === "DONE" ? new Date() : null,
        source: "admin_case_task_panel"
      }
    });

    await tx.caseEvent.create({
      data: {
        caseId: snapshot.id,
        eventType: "CASE_TASK_CREATED",
        actorName: input.actorName?.trim() || "system",
        message: `Case task created: ${created.title}`,
        payloadJson: JSON.stringify({
          taskId: created.id,
          title: created.title,
          status: created.status,
          priority: created.priority,
          dueDate: created.dueDate?.toISOString() ?? null,
          assignedTo: created.assignedTo
        })
      }
    });

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after task creation."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateCaseTaskMetadata(input: UpdateCaseTaskMetadataInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseTask.findUnique({
      where: { id: input.taskId },
      select: {
        id: true,
        caseId: true,
        title: true,
        details: true,
        description: true,
        priority: true,
        dueDate: true,
        assignedTo: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new CaseTaskUpdateError("CASE_TASK_NOT_FOUND", "Case task not found.");
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new CaseTaskUpdateError(
        "CASE_MATTER_MISMATCH",
        "Case task does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseTaskConcurrentUpdateError(
        "Case task was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const title = normalizeTaskTitle(input.title);
    if (!title) {
      throw new CaseTaskUpdateError("CASE_TASK_TITLE_EMPTY", "Case task title must not be empty.");
    }

    const details = input.details?.trim() || null;
    const description = input.description?.trim() || null;
    const assignedTo = input.assignedTo?.trim() || null;
    const dueDate = parseOptionalCaseTaskUpdateDueDate(input.dueDate);
    const changes: string[] = [];

    if (snapshot.title !== title) changes.push("title");
    if ((snapshot.details ?? null) !== details) changes.push("details");
    if ((snapshot.description ?? null) !== description) changes.push("description");
    if (snapshot.priority !== input.priority) changes.push("priority");
    if (!sameOptionalDate(snapshot.dueDate, dueDate)) changes.push("dueDate");
    if ((snapshot.assignedTo ?? null) !== assignedTo) changes.push("assignedTo");

    if (changes.length > 0) {
      await tx.caseTask.update({
        where: { id: snapshot.id },
        data: {
          title,
          details,
          description,
          priority: input.priority,
          dueDate,
          assignedTo
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: input.caseMatterId,
          eventType: "CASE_TASK_METADATA_UPDATED",
          actorName: input.actorName?.trim() || "system",
          message: `Case task metadata updated: ${snapshot.title} (${changes.join(", ")})`,
          payloadJson: JSON.stringify({
            taskId: snapshot.id,
            changedFields: changes,
            previous: {
              title: snapshot.title,
              details: snapshot.details,
              description: snapshot.description,
              priority: snapshot.priority,
              dueDate: snapshot.dueDate?.toISOString() ?? null,
              assignedTo: snapshot.assignedTo
            },
            next: {
              title,
              details,
              description,
              priority: input.priority,
              dueDate: dueDate?.toISOString() ?? null,
              assignedTo
            }
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, input.caseMatterId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after task metadata update."
      );
    }

    return attachNextAction(caseMatter);
  });
}

export async function updateCaseTaskStatus(input: UpdateCaseTaskStatusInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseTask.findUnique({
      where: { id: input.taskId },
      select: {
        id: true,
        caseId: true,
        title: true,
        status: true,
        updatedAt: true
      }
    });

    if (!snapshot) {
      throw new CaseTaskUpdateError("CASE_TASK_NOT_FOUND", "Case task not found.");
    }

    if (snapshot.caseId !== input.caseMatterId) {
      throw new CaseTaskUpdateError(
        "CASE_MATTER_MISMATCH",
        "Case task does not belong to the case matter."
      );
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseTaskConcurrentUpdateError(
        "Case task was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    const statusChangeNote = input.statusChangeNote?.trim() || null;
    if (snapshot.status !== input.status) {
      const now = new Date();
      await tx.caseTask.update({
        where: { id: snapshot.id },
        data: {
          status: input.status,
          completedAt: input.status === "DONE" ? now : null
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: input.caseMatterId,
          eventType: "CASE_TASK_STATUS_CHANGED",
          actorName: input.actorName?.trim() || "system",
          message: statusChangeNote
            ? `Case task status changed: ${snapshot.title} (${snapshot.status} -> ${input.status}) (${statusChangeNote})`
            : `Case task status changed: ${snapshot.title} (${snapshot.status} -> ${input.status})`,
          payloadJson: JSON.stringify({
            taskId: snapshot.id,
            title: snapshot.title,
            previousStatus: snapshot.status,
            nextStatus: input.status,
            completedAt: input.status === "DONE" ? now.toISOString() : null,
            statusChangeNote
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, input.caseMatterId);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after task status update."
      );
    }

    return attachNextAction(caseMatter);
  });
}
