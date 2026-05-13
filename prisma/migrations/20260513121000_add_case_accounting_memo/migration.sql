-- CreateEnum
CREATE TYPE "AccountingFeeStatus" AS ENUM ('UNSET', 'ESTIMATED', 'CONFIRMED', 'WAIVED');

-- CreateEnum
CREATE TYPE "AccountingPaymentStatus" AS ENUM ('UNSET', 'UNPAID', 'PARTIAL', 'PAID', 'REFUNDED');

-- CreateTable
CREATE TABLE "CaseAccountingMemo" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "feeAmount" INTEGER,
    "feeStatus" "AccountingFeeStatus" NOT NULL DEFAULT 'UNSET',
    "paymentStatus" "AccountingPaymentStatus" NOT NULL DEFAULT 'UNSET',
    "paidAmount" INTEGER,
    "paidAt" TIMESTAMP(3),
    "paymentMemo" TEXT,
    "invoiceMemo" TEXT,
    "ledgerMemo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseAccountingMemo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseAccountingMemo_caseId_key" ON "CaseAccountingMemo"("caseId");

-- CreateIndex
CREATE INDEX "CaseAccountingMemo_feeStatus_idx" ON "CaseAccountingMemo"("feeStatus");

-- CreateIndex
CREATE INDEX "CaseAccountingMemo_paymentStatus_idx" ON "CaseAccountingMemo"("paymentStatus");

-- AddForeignKey
ALTER TABLE "CaseAccountingMemo" ADD CONSTRAINT "CaseAccountingMemo_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
