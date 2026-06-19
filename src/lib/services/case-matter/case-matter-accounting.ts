import { prisma } from "@/lib/prisma/client";

import {
  attachNextAction,
  getCaseMatterOperationalByIdTx,
  normalizeAccountingMemo,
  normalizeExpectedUpdatedAt,
  parseOptionalAccountingPaidAt,
  sameOptionalDate
} from "./_internal";
import {
  CaseAccountingMemoConcurrentUpdateError,
  CaseAccountingMemoUpdateError,
  CaseMatterConcurrentUpdateError,
  CaseMatterConversionError,
  type UpdateCaseAccountingMemoInput
} from "./case-matter-types";

export async function updateCaseAccountingMemo(input: UpdateCaseAccountingMemoInput) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await tx.caseMatter.findUnique({
      where: { id: input.caseMatterId },
      select: {
        id: true,
        updatedAt: true,
        accountingMemo: {
          select: {
            id: true,
            caseId: true,
            feeAmount: true,
            feeStatus: true,
            paymentStatus: true,
            paidAmount: true,
            paidAt: true,
            paymentMemo: true,
            invoiceMemo: true,
            ledgerMemo: true,
            updatedAt: true
          }
        }
      }
    });

    if (!snapshot) {
      throw new CaseMatterConversionError("CASE_MATTER_NOT_FOUND", "Case matter not found.");
    }

    const existing = snapshot.accountingMemo;
    if (existing && existing.caseId !== input.caseMatterId) {
      throw new CaseAccountingMemoUpdateError(
        "CASE_MATTER_MISMATCH",
        "Accounting memo does not belong to the case matter."
      );
    }

    if (existing) {
      const expectedUpdatedAt = normalizeExpectedUpdatedAt(input.expectedUpdatedAt);
      if (expectedUpdatedAt && expectedUpdatedAt.getTime() !== existing.updatedAt.getTime()) {
        throw new CaseAccountingMemoConcurrentUpdateError(
          "Accounting memo was updated by another session. Reload and try again.",
          existing.updatedAt.toISOString()
        );
      }
    } else {
      const expectedCaseUpdatedAt = normalizeExpectedUpdatedAt(input.expectedCaseUpdatedAt);
      if (expectedCaseUpdatedAt && expectedCaseUpdatedAt.getTime() !== snapshot.updatedAt.getTime()) {
        throw new CaseMatterConcurrentUpdateError(
          "Case matter was updated by another session. Reload and try again.",
          snapshot.updatedAt.toISOString()
        );
      }
    }

    const next = {
      feeAmount: input.feeAmount ?? null,
      feeStatus: input.feeStatus ?? "UNSET",
      paymentStatus: input.paymentStatus ?? "UNSET",
      paidAmount: input.paidAmount ?? null,
      paidAt: parseOptionalAccountingPaidAt(input.paidAt),
      paymentMemo: normalizeAccountingMemo(input.paymentMemo),
      invoiceMemo: normalizeAccountingMemo(input.invoiceMemo),
      ledgerMemo: normalizeAccountingMemo(input.ledgerMemo)
    };

    const changes: string[] = [];
    if (!existing) {
      changes.push("created");
    } else {
      if ((existing.feeAmount ?? null) !== next.feeAmount) changes.push("feeAmount");
      if (existing.feeStatus !== next.feeStatus) changes.push("feeStatus");
      if (existing.paymentStatus !== next.paymentStatus) changes.push("paymentStatus");
      if ((existing.paidAmount ?? null) !== next.paidAmount) changes.push("paidAmount");
      if (!sameOptionalDate(existing.paidAt, next.paidAt)) changes.push("paidAt");
      if ((existing.paymentMemo ?? null) !== next.paymentMemo) changes.push("paymentMemo");
      if ((existing.invoiceMemo ?? null) !== next.invoiceMemo) changes.push("invoiceMemo");
      if ((existing.ledgerMemo ?? null) !== next.ledgerMemo) changes.push("ledgerMemo");
    }

    if (changes.length > 0) {
      const saved = existing
        ? await tx.caseAccountingMemo.update({
            where: { id: existing.id },
            data: next
          })
        : await tx.caseAccountingMemo.create({
            data: {
              caseId: snapshot.id,
              ...next
            }
          });

      await tx.caseEvent.create({
        data: {
          caseId: snapshot.id,
          eventType: "CASE_ACCOUNTING_UPDATED",
          actorName: input.actorName?.trim() || "system",
          message: `Case accounting updated: fee ${existing?.feeStatus ?? "UNSET"} -> ${saved.feeStatus}, payment ${existing?.paymentStatus ?? "UNSET"} -> ${saved.paymentStatus}`,
          payloadJson: JSON.stringify({
            accountingMemoId: saved.id,
            changedFields: changes,
            previous: existing
              ? {
                  feeAmount: existing.feeAmount,
                  feeStatus: existing.feeStatus,
                  paymentStatus: existing.paymentStatus,
                  paidAmount: existing.paidAmount,
                  paidAt: existing.paidAt?.toISOString() ?? null
                }
              : null,
            next: {
              feeAmount: saved.feeAmount,
              feeStatus: saved.feeStatus,
              paymentStatus: saved.paymentStatus,
              paidAmount: saved.paidAmount,
              paidAt: saved.paidAt?.toISOString() ?? null
            }
          })
        }
      });
    }

    const caseMatter = await getCaseMatterOperationalByIdTx(tx, snapshot.id);
    if (!caseMatter) {
      throw new CaseMatterConversionError(
        "CASE_MATTER_NOT_FOUND",
        "Case matter lookup failed after accounting memo update."
      );
    }

    return attachNextAction(caseMatter);
  });
}
