-- Migration: Add AdminAppealDetail, LicensePermitDetail, ContractInvestigationDetail

-- AdminAppealDetail (행정심판)
CREATE TABLE IF NOT EXISTS "AdminAppealDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL UNIQUE,
    "appealType" TEXT NOT NULL DEFAULT 'ADMINISTRATIVE_APPEAL',
    "disposingAgency" TEXT,
    "reviewingAgency" TEXT,
    "dispositionContent" TEXT,
    "dispositionDate" TIMESTAMP(3),
    "noticeReceivedDate" TIMESTAMP(3),
    "filingDeadline" TIMESTAMP(3),
    "filedAt" TIMESTAMP(3),
    "hearingDate" TIMESTAMP(3),
    "decisionExpectedDate" TIMESTAMP(3),
    "decisionReceivedDate" TIMESTAMP(3),
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "resultSummary" TEXT,
    "groundsSummary" TEXT,
    "evidenceSummary" TEXT,
    "caseNoOfficial" TEXT,
    "deadlineVerifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminAppealDetail_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AdminAppealDetail_appealType_idx" ON "AdminAppealDetail"("appealType");
CREATE INDEX IF NOT EXISTS "AdminAppealDetail_filingDeadline_idx" ON "AdminAppealDetail"("filingDeadline");
CREATE INDEX IF NOT EXISTS "AdminAppealDetail_result_idx" ON "AdminAppealDetail"("result");
CREATE INDEX IF NOT EXISTS "AdminAppealDetail_dispositionDate_idx" ON "AdminAppealDetail"("dispositionDate");

-- LicensePermitDetail (인허가)
CREATE TABLE IF NOT EXISTS "LicensePermitDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL UNIQUE,
    "permitType" TEXT NOT NULL DEFAULT 'OTHER',
    "targetAgency" TEXT,
    "applicationNo" TEXT,
    "businessName" TEXT,
    "businessAddress" TEXT,
    "applicationDate" TIMESTAMP(3),
    "reviewDeadline" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "stage" TEXT NOT NULL DEFAULT 'CONSULTATION',
    "requirementsSummary" TEXT,
    "missingRequirements" TEXT,
    "supplementContent" TEXT,
    "supplementDueDate" TIMESTAMP(3),
    "conditionsSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LicensePermitDetail_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LicensePermitDetail_permitType_idx" ON "LicensePermitDetail"("permitType");
CREATE INDEX IF NOT EXISTS "LicensePermitDetail_stage_idx" ON "LicensePermitDetail"("stage");
CREATE INDEX IF NOT EXISTS "LicensePermitDetail_reviewDeadline_idx" ON "LicensePermitDetail"("reviewDeadline");
CREATE INDEX IF NOT EXISTS "LicensePermitDetail_supplementDueDate_idx" ON "LicensePermitDetail"("supplementDueDate");

-- ContractInvestigationDetail (계약서/사실조사)
CREATE TABLE IF NOT EXISTS "ContractInvestigationDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL UNIQUE,
    "contractType" TEXT NOT NULL DEFAULT 'OTHER',
    "counterpartyName" TEXT,
    "counterpartyContact" TEXT,
    "contractDate" TIMESTAMP(3),
    "contractAmount" INTEGER,
    "contractSummary" TEXT,
    "disputeContent" TEXT,
    "investigationStatus" TEXT NOT NULL DEFAULT 'REQUESTED',
    "investigationScope" TEXT,
    "reportDueDate" TIMESTAMP(3),
    "reportDeliveredAt" TIMESTAMP(3),
    "keyFindings" TEXT,
    "legalBasisSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContractInvestigationDetail_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ContractInvestigationDetail_contractType_idx" ON "ContractInvestigationDetail"("contractType");
CREATE INDEX IF NOT EXISTS "ContractInvestigationDetail_investigationStatus_idx" ON "ContractInvestigationDetail"("investigationStatus");
CREATE INDEX IF NOT EXISTS "ContractInvestigationDetail_reportDueDate_idx" ON "ContractInvestigationDetail"("reportDueDate");
