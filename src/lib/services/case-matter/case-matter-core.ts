import type {
  CaseMatterCategory,
  Prisma
} from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import { generateCaseMatterNumberTx } from "@/lib/services/case-matter-number-helpers";
import {
  assertCaseMatterTransition,
  getAllowedCaseMatterTransitions
} from "@/lib/services/case-matter-status-transition-helpers";

import {
  attachNextAction,
  getCaseMatterOperationalByIdTx,
  inferCaseMatterStatus,
  inferMatterTypeFromInquiry,
  inferPriority,
  inferRiskLevel,
  normalizeExpectedUpdatedAt,
  operationalInclude
} from "./_internal";
import {
  CaseMatterConcurrentUpdateError,
  CaseMatterConversionError,
  CaseMatterStatusGuardError,
  type ConvertInquiryToCaseMatterInput,
  type ConvertInquiryToCaseMatterResult,
  type UpdateCaseMatterStatusInput
} from "./case-matter-types";

export async function listCaseMattersForInquiry(inquiryId: string) {
  const caseMatters = await prisma.caseMatter.findMany({
    where: { inquiryId },
    include: operationalInclude,
    orderBy: [{ createdAt: "desc" }]
  });

  return caseMatters.map(attachNextAction);
}

export async function getLatestCaseMatterForInquiry(inquiryId: string) {
  const caseMatter = await prisma.caseMatter.findFirst({
    where: { inquiryId },
    include: operationalInclude,
    orderBy: [{ createdAt: "desc" }]
  });

  if (!caseMatter) return null;
  return attachNextAction(caseMatter);
}

export async function listCaseMatters(category?: string, query?: string) {
  const where: Prisma.CaseMatterWhereInput = {};
  if (category) where.category = category as never;
  if (query && query.trim()) {
    const q = query.trim();
    where.OR = [
      { title: { contains: q } },
      { caseNo: { contains: q } },
      { summary: { contains: q } },
      { inquiry: { contactName: { contains: q } } },
      { inquiry: { phone: { contains: q } } },
      { inquiry: { email: { contains: q } } }
    ];
  }
  const caseMatters = await prisma.caseMatter.findMany({
    where,
    include: operationalInclude,
    orderBy: [{ updatedAt: "desc" }]
  });

  return caseMatters.map(attachNextAction);
}

export async function getCaseMatterById(caseMatterId: string) {
  const caseMatter = await prisma.caseMatter.findUnique({
    where: { id: caseMatterId },
    include: operationalInclude
  });

  if (!caseMatter) return null;
  return attachNextAction(caseMatter);
}

export async function convertInquiryToCaseMatter(
  input: ConvertInquiryToCaseMatterInput
): Promise<ConvertInquiryToCaseMatterResult> {
  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({
      where: { id: input.inquiryId },
      select: {
        id: true,
        status: true,
        inquiryType: true,
        urgencyLevel: true,
        contactName: true,
        organizationName: true,
        email: true,
        phone: true,
        nationality: true,
        title: true,
        description: true,
        generatedSummary: true,
        dueDate: true,
        assignee: true,
        internalMemo: true,
        caseMatters: {
          orderBy: [{ createdAt: "desc" }],
          take: 1,
          select: { id: true }
        }
      }
    });

    if (!inquiry) {
      throw new CaseMatterConversionError("INQUIRY_NOT_FOUND", "Inquiry not found.");
    }

    const existingCaseMatterId = inquiry.caseMatters[0]?.id ?? null;
    if (existingCaseMatterId && !input.forceCreate) {
      const existingCaseMatter = await getCaseMatterOperationalByIdTx(tx, existingCaseMatterId);
      if (!existingCaseMatter) {
        throw new CaseMatterConversionError(
          "CASE_MATTER_NOT_FOUND",
          "Case matter lookup failed for the existing conversion result."
        );
      }

      return {
        created: false,
        caseMatter: attachNextAction(existingCaseMatter),
        linkedQuoteId: null,
        linkedContractDraftId: null
      };
    }

    const matterType = input.matterType?.trim() || inferMatterTypeFromInquiry(inquiry.inquiryType);
    const title =
      input.title?.trim() ||
      `${inquiry.contactName}${inquiry.organizationName ? ` (${inquiry.organizationName})` : ""} / ${inquiry.title}`;
    const assignedTo = input.assignedTo?.trim() || inquiry.assignee || null;
    const caseNo = await generateCaseMatterNumberTx(tx, matterType);

    const createdCaseMatter = await tx.caseMatter.create({
      data: {
        caseNo,
        title,
        matterType,
        category: (input.category ?? "OTHER") as CaseMatterCategory,
        status: inferCaseMatterStatus(inquiry.status),
        priority: inferPriority(inquiry.urgencyLevel),
        riskLevel: inferRiskLevel(inquiry.urgencyLevel),
        inquiryId: inquiry.id,
        openedAt: new Date(),
        dueDate: inquiry.dueDate,
        nextActionAt: inquiry.dueDate,
        assignedTo,
        summary: inquiry.generatedSummary,
        internalMemo: inquiry.internalMemo
      }
    });

    await tx.caseParty.create({
      data: {
        caseId: createdCaseMatter.id,
        role: "CLIENT",
        name: inquiry.contactName,
        email: inquiry.email,
        phone: inquiry.phone,
        organization: inquiry.organizationName,
        nationality: inquiry.nationality
      }
    });

    await tx.caseTask.create({
      data: {
        caseId: createdCaseMatter.id,
        title: "Review intake facts and open document checklist",
        status: "TODO",
        priority: inferPriority(inquiry.urgencyLevel),
        dueDate: inquiry.dueDate,
        assignedTo
      }
    });

    // 카테고리 기본 체크리스트 자동 시드 (transaction 내)
    const { CATEGORY_DOCUMENT_TEMPLATES } = await import("@/lib/services/category-required-documents");
    const tmpls = CATEGORY_DOCUMENT_TEMPLATES[input.category ?? "OTHER"] ?? CATEGORY_DOCUMENT_TEMPLATES.OTHER;
    if (tmpls.length > 0) {
      await tx.requiredDocument.createMany({
        data: tmpls.map((t) => ({
          caseId: createdCaseMatter.id,
          name: t.name,
          description: t.description ?? null,
          required: t.required,
          status: "NEEDED" as never
        }))
      });
    }

    await tx.caseEvent.create({
      data: {
        caseId: createdCaseMatter.id,
        eventType: "CASE_CONVERTED_FROM_INQUIRY",
        actorName: input.actorName?.trim() || "system",
        message: `Case created from inquiry ${inquiry.id}`,
        payloadJson: JSON.stringify({
          inquiryStatus: inquiry.status,
          inquiryType: inquiry.inquiryType,
          urgencyLevel: inquiry.urgencyLevel
        })
      }
    });

    const acceptedQuote = await tx.quote.findFirst({
      where: {
        inquiryId: inquiry.id,
        status: "ACCEPTED",
        caseMatterId: null
      },
      orderBy: [{ createdAt: "desc" }]
    });

    if (acceptedQuote) {
      await tx.quote.update({
        where: { id: acceptedQuote.id },
        data: { caseMatterId: createdCaseMatter.id }
      });
    }

    const linkedContractDraft = acceptedQuote
      ? await tx.contractDraft.findFirst({
          where: {
            inquiryId: inquiry.id,
            quoteId: acceptedQuote.id,
            caseMatterId: null
          },
          orderBy: [{ createdAt: "desc" }]
        })
      : null;

    if (linkedContractDraft) {
      await tx.contractDraft.update({
        where: { id: linkedContractDraft.id },
        data: { caseMatterId: createdCaseMatter.id }
      });
    }

    if (input.updateInquiryStatusToWon && inquiry.status !== "WON" && inquiry.status !== "CLOSED") {
      await tx.inquiry.update({
        where: { id: inquiry.id },
        data: { status: "WON" }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, createdCaseMatter.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Created case matter could not be loaded."
      );
    }

    return {
      created: true,
      caseMatter: attachNextAction(caseMatter),
      linkedQuoteId: acceptedQuote?.id ?? null,
      linkedContractDraftId: linkedContractDraft?.id ?? null
    };
  });
}

export async function updateCaseMatterStatus(input: UpdateCaseMatterStatusInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        closedAt: true
      }
    });

    if (!snapshot) {
      throw new CaseMatterConversionError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
    if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
      throw new CaseMatterConcurrentUpdateError(
        "Case matter was updated by another session. Reload and try again.",
        snapshot.updatedAt.toISOString()
      );
    }

    if (snapshot.status !== input.status) {
      try {
        assertCaseMatterTransition(snapshot.status, input.status);
      } catch {
        const allowedTransitions = getAllowedCaseMatterTransitions(snapshot.status);
        throw new CaseMatterStatusGuardError(
          `Cannot change case status from ${snapshot.status} to ${input.status}.`,
          [`Allowed next statuses: ${allowedTransitions.join(", ")}`]
        );
      }
    }

    const statusChangeNote = input.statusChangeNote?.trim() || null;
    const closedAt =
      input.status === "CLOSED" || input.status === "CANCELLED"
        ? snapshot.closedAt ?? new Date()
        : null;

    if (snapshot.status !== input.status) {
      await tx.caseMatter.update({
        where: { id: snapshot.id },
        data: {
          status: input.status,
          closedAt
        }
      });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.id,
          eventType: "CASE_STATUS_CHANGED",
          actorName: input.actorName?.trim() || "system",
          message: statusChangeNote
            ? `Case status changed: ${snapshot.status} -> ${input.status} (${statusChangeNote})`
            : `Case status changed: ${snapshot.status} -> ${input.status}`,
          payloadJson: JSON.stringify({
            previousStatus: snapshot.status,
            nextStatus: input.status,
            statusChangeNote
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after status update."
      );
    }

    return attachNextAction(caseMatter);
  });
}
