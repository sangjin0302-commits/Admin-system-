-- CreateTable
CREATE TABLE "ImmigrationCaseDetail" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "dispositionType" TEXT,
    "dispositionDate" TIMESTAMP(3),
    "noticeDate" TIMESTAMP(3),
    "serviceDate" TIMESTAMP(3),
    "appealDeadline" TIMESTAMP(3),
    "departureDeadline" TIMESTAMP(3),
    "detentionStartDate" TIMESTAMP(3),
    "stayExpiryDate" TIMESTAMP(3),
    "submissionDeadline" TIMESTAMP(3),
    "supplementDeadline" TIMESTAMP(3),
    "resultExpectedDate" TIMESTAMP(3),
    "nationality" TEXT,
    "currentStayStatus" TEXT,
    "familyInKoreaSummary" TEXT,
    "residenceBaseSummary" TEXT,
    "employmentOrSchoolSummary" TEXT,
    "violationHistorySummary" TEXT,
    "scopeReviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "attorneyScopeRisk" BOOLEAN NOT NULL DEFAULT false,
    "officialFormCheckRequired" BOOLEAN NOT NULL DEFAULT true,
    "deadlineVerifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImmigrationCaseDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImmigrationCaseDetail_caseId_key" ON "ImmigrationCaseDetail"("caseId");

-- CreateIndex
CREATE INDEX "ImmigrationCaseDetail_dispositionType_idx" ON "ImmigrationCaseDetail"("dispositionType");

-- CreateIndex
CREATE INDEX "ImmigrationCaseDetail_appealDeadline_idx" ON "ImmigrationCaseDetail"("appealDeadline");

-- CreateIndex
CREATE INDEX "ImmigrationCaseDetail_departureDeadline_idx" ON "ImmigrationCaseDetail"("departureDeadline");

-- CreateIndex
CREATE INDEX "ImmigrationCaseDetail_stayExpiryDate_idx" ON "ImmigrationCaseDetail"("stayExpiryDate");

-- CreateIndex
CREATE INDEX "ImmigrationCaseDetail_deadlineVerifiedAt_idx" ON "ImmigrationCaseDetail"("deadlineVerifiedAt");

-- AddForeignKey
ALTER TABLE "ImmigrationCaseDetail" ADD CONSTRAINT "ImmigrationCaseDetail_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
