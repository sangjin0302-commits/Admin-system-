-- Migration: Add AdminAppealDetail, LicensePermitDetail, ContractInvestigationDetail

-- AdminAppealDetail (행정심판)
CREATE TABLE "AdminAppealDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL UNIQUE,
    "appealType" TEXT NOT NULL DEFAULT 'ADMINISTRATIVE_APPEAL',
    "disposingAgency" TEXT,
    "reviewingAgency" TEXT,
    "dispositionContent" TEXT,
    "dispositionDate" DATETIME,
    "noticeReceivedDate" DATETIME,
    "filingDeadline" DATETIME,
    "filedAt" DATETIME,
    "hearingDate" DATETIME,
    "decisionExpectedDate" DATETIME,
    "decisionReceivedDate" DATETIME,
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "resultSummary" TEXT,
    "groundsSummary" TEXT,
    "evidenceSummary" TEXT,
    "caseNoOfficial" TEXT,
    "deadlineVerifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminAppealDetail_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AdminAppealDetail_appealType_idx" ON "AdminAppealDetail"("appealType");
CREATE INDEX "AdminAppealDetail_filingDeadline_idx" ON "AdminAppealDetail"("filingDeadline");
CREATE INDEX "AdminAppealDetail_result_idx" ON "AdminAppealDetail"("result");
CREATE INDEX "AdminAppealDetail_dispositionDate_idx" ON "AdminAppealDetail"("dispositionDate");

-- LicensePermitDetail (인허가)
CREATE TABLE "LicensePermitDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL UNIQUE,
    "permitType" TEXT NOT NULL DEFAULT 'OTHER',
    "targetAgency" TEXT,
    "applicationNo" TEXT,
    "businessName" TEXT,
    "businessAddress" TEXT,
    "applicationDate" DATETIME,
    "reviewDeadline" DATETIME,
    "approvalDate" DATETIME,
    "expiryDate" DATETIME,
    "stage" TEXT NOT NULL DEFAULT 'CONSULTATION',
    "requirementsSummary" TEXT,
    "missingRequirements" TEXT,
    "supplementContent" TEXT,
    "supplementDueDate" DATETIME,
    "conditionsSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LicensePermitDetail_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LicensePermitDetail_permitType_idx" ON "LicensePermitDetail"("permitType");
CREATE INDEX "LicensePermitDetail_stage_idx" ON "LicensePermitDetail"("stage");
CREATE INDEX "LicensePermitDetail_reviewDeadline_idx" ON "LicensePermitDetail"("reviewDeadline");
CREATE INDEX "LicensePermitDetail_supplementDueDate_idx" ON "LicensePermitDetail"("supplementDueDate");

-- ContractInvestigationDetail (계약서/사실조사)
CREATE TABLE "ContractInvestigationDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL UNIQUE,
    "contractType" TEXT NOT NULL DEFAULT 'OTHER',
    "counterpartyName" TEXT,
    "counterpartyContact" TEXT,
    "contractDate" DATETIME,
    "contractAmount" INTEGER,
    "contractSummary" TEXT,
    "disputeContent" TEXT,
    "investigationStatus" TEXT NOT NULL DEFAULT 'REQUESTED',
    "investigationScope" TEXT,
    "reportDueDate" DATETIME,
    "reportDeliveredAt" DATETIME,
    "keyFindings" TEXT,
    "legalBasisSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractInvestigationDetail_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ContractInvestigationDetail_contractType_idx" ON "ContractInvestigationDetail"("contractType");
CREATE INDEX "ContractInvestigationDetail_investigationStatus_idx" ON "ContractInvestigationDetail"("investigationStatus");
CREATE INDEX "ContractInvestigationDetail_reportDueDate_idx" ON "ContractInvestigationDetail"("reportDueDate");
