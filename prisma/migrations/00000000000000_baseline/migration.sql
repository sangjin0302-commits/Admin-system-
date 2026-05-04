-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('FOREIGNER_VISA', 'IMMIGRATION_STAY', 'APOSTILLE_CONSULAR', 'TRANSLATION_NOTARY', 'GENERAL_ADMIN_CIVIL', 'CORPORATE_REQUEST', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'PRE_DIAGNOSED', 'CONSULTATION_REQUIRED', 'QUOTE_DRAFTED', 'QUOTE_PENDING', 'ON_HOLD', 'IN_REVIEW', 'WAITING_CONSULTATION', 'QUOTE_SENT', 'WON', 'CLOSED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('KO', 'EN', 'AR');

-- CreateEnum
CREATE TYPE "PricingOptionType" AS ENUM ('FLAT', 'PERCENT');

-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('URGENCY', 'CONSULT', 'PAYMENT', 'POLICY');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'READY_TO_SEND', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuoteLineKind" AS ENUM ('SERVICE', 'URGENCY', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentStageKind" AS ENUM ('RETAINER', 'MIDTERM', 'SUCCESS');

-- CreateEnum
CREATE TYPE "ContractDraftStatus" AS ENUM ('DRAFT', 'FINALIZED', 'VOID');

-- CreateEnum
CREATE TYPE "CaseStage" AS ENUM ('CONTRACT_PREPARATION', 'ACTIVE', 'ON_HOLD', 'CLOSED');

-- CreateEnum
CREATE TYPE "BridgeWorkflowStatus" AS ENUM ('NEW_INQUIRY', 'TRIAGE_REVIEW', 'AWAITING_MORE_FACTS', 'PROFILED', 'PROFILE_REVIEW_REQUIRED', 'CASE_CARD_CREATED', 'AWAITING_SOURCE_VERIFICATION', 'DRAFT_CREATED', 'MESSAGE_DRAFT_CREATED', 'APPROVAL_PENDING', 'APPROVED', 'REVISION_REQUESTED', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "WorkflowTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELED');

-- CreateEnum
CREATE TYPE "WorkflowDraftStatus" AS ENUM ('DRAFT_CREATED', 'APPROVAL_PENDING', 'APPROVED', 'REVISION_REQUESTED', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CaseMatterStatus" AS ENUM ('INTAKE_REVIEW', 'CONSULTING', 'QUOTED', 'CONTRACT_PENDING', 'OPEN', 'DOCUMENT_COLLECTING', 'DOCUMENT_REVIEWING', 'READY_TO_SUBMIT', 'SUBMITTED', 'SUPPLEMENT_REQUESTED', 'WAITING_AGENCY', 'RESULT_RECEIVED', 'CLOSING', 'CLOSED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CasePartyRole" AS ENUM ('CLIENT', 'APPLICANT', 'GUARDIAN', 'EMPLOYER', 'AGENT', 'OTHER');

-- CreateEnum
CREATE TYPE "RequiredDocumentStatus" AS ENUM ('NEEDED', 'REQUESTED', 'RECEIVED', 'IN_REVIEW', 'NEEDS_FIX', 'APPROVED', 'REJECTED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "CaseDocumentStatus" AS ENUM ('RECEIVED', 'IN_REVIEW', 'NEEDS_FIX', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentVersionStatus" AS ENUM ('DRAFT', 'CLIENT_PROVIDED', 'INTERNAL_EDIT', 'REVIEWED', 'APPROVED_FOR_SUBMISSION', 'SUPERSEDED', 'VOID');

-- CreateEnum
CREATE TYPE "SubmissionPackageStatus" AS ENUM ('DRAFT', 'READY', 'SUBMITTED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionMethod" AS ENUM ('ONLINE', 'VISIT', 'POSTAL', 'EMAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "AgencySubmissionStatus" AS ENUM ('READY', 'SUBMITTED', 'RECEIPTED', 'UNDER_REVIEW', 'SUPPLEMENT_REQUESTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplementStatus" AS ENUM ('RECEIVED', 'ANALYZING', 'DOCS_REQUESTED', 'CLIENT_WAITING', 'RESPONSE_DRAFTING', 'READY_TO_RESPOND', 'RESPONDED', 'CLOSED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CaseTaskStatus" AS ENUM ('OPEN', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CaseTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "inquiryType" "InquiryType" NOT NULL DEFAULT 'UNKNOWN',
    "urgencyLevel" "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
    "classificationConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualificationScore" INTEGER NOT NULL DEFAULT 0,
    "preferredLanguage" "LanguageCode" NOT NULL DEFAULT 'KO',
    "clientType" "ClientType" NOT NULL DEFAULT 'INDIVIDUAL',
    "contactName" TEXT NOT NULL,
    "organizationName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "nationality" TEXT,
    "currentStatus" TEXT,
    "requestedOutcome" TEXT,
    "requestedInquiryType" "InquiryType",
    "declaredUrgency" "UrgencyLevel",
    "documentCountry" TEXT,
    "targetAgency" TEXT,
    "hasPreparedDocuments" BOOLEAN NOT NULL DEFAULT false,
    "needsTranslation" BOOLEAN NOT NULL DEFAULT false,
    "isCorporateRequest" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "assignee" TEXT,
    "internalMemo" TEXT,
    "communicationLogs" TEXT NOT NULL DEFAULT '[]',
    "latestContactAt" TIMESTAMP(3),
    "latestContactChannel" TEXT,
    "latestContactSummary" TEXT,
    "nextContactAt" TIMESTAMP(3),
    "responsePending" BOOLEAN NOT NULL DEFAULT false,
    "consultationRequired" BOOLEAN NOT NULL DEFAULT false,
    "riskComplexityHint" TEXT,
    "precheckRecommendedDocs" TEXT NOT NULL DEFAULT '[]',
    "wantsCallback" BOOLEAN NOT NULL DEFAULT false,
    "consentToPrivacy" BOOLEAN NOT NULL DEFAULT false,
    "intakeSource" TEXT NOT NULL DEFAULT 'website',
    "generatedSummary" TEXT NOT NULL,
    "generatedGuidance" TEXT NOT NULL,
    "generatedReceiptMessage" TEXT NOT NULL,
    "classificationReason" TEXT NOT NULL,
    "recommendedNextStep" TEXT NOT NULL,
    "serviceTags" TEXT NOT NULL DEFAULT '[]',
    "lawbotLastAnalyzedAt" TIMESTAMP(3),
    "lawbotSnapshotVersion" INTEGER NOT NULL DEFAULT 1,
    "lawbotSnapshotStatus" TEXT,
    "lawbotSnapshotSummary" TEXT,
    "lawbotSnapshotPayload" TEXT,
    "bridgeWorkflowStatus" "BridgeWorkflowStatus" NOT NULL DEFAULT 'NEW_INQUIRY',
    "bridgeReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "bridgeMustVerify" TEXT NOT NULL DEFAULT '[]',
    "bridgeMustVerifySources" TEXT NOT NULL DEFAULT '[]',
    "bridgeRiskFlags" TEXT NOT NULL DEFAULT '[]',
    "bridgePractitionerGuide" TEXT,
    "bridgeCaseOutlook" TEXT,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "minPrice" INTEGER NOT NULL,
    "maxPrice" INTEGER NOT NULL,
    "isAppeal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'legacy-admin-suite',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingOption" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "optionType" "PricingOptionType" NOT NULL,
    "flatAmount" INTEGER,
    "percentRate" INTEGER,
    "unitLabel" TEXT,
    "isVat" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'legacy-admin-suite',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ruleType" "PricingRuleType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "numericValue" INTEGER,
    "percentValue" INTEGER,
    "jsonValue" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'legacy-admin-suite',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "caseMatterId" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "selectedServiceLegacyIds" TEXT NOT NULL DEFAULT '[]',
    "selectedOptionLegacyIds" TEXT NOT NULL DEFAULT '[]',
    "urgencyRuleCode" TEXT NOT NULL,
    "consultRuleCode" TEXT NOT NULL,
    "paymentRuleCode" TEXT NOT NULL DEFAULT 'PAYMENT_STANDARD',
    "rangeMode" BOOLEAN NOT NULL DEFAULT true,
    "serviceBaseMin" INTEGER NOT NULL DEFAULT 0,
    "serviceBaseMax" INTEGER NOT NULL DEFAULT 0,
    "subtotalMin" INTEGER NOT NULL DEFAULT 0,
    "subtotalMax" INTEGER NOT NULL DEFAULT 0,
    "vatAmountMin" INTEGER NOT NULL DEFAULT 0,
    "vatAmountMax" INTEGER NOT NULL DEFAULT 0,
    "totalMin" INTEGER NOT NULL DEFAULT 0,
    "totalMax" INTEGER NOT NULL DEFAULT 0,
    "consultFee" INTEGER NOT NULL DEFAULT 0,
    "successFeeRestricted" BOOLEAN NOT NULL DEFAULT false,
    "draftNotes" TEXT,
    "calculationSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLineItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "serviceTypeId" TEXT,
    "kind" "QuoteLineKind" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "amountMin" INTEGER NOT NULL,
    "amountMax" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAdjustment" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "pricingOptionId" TEXT,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "optionType" "PricingOptionType" NOT NULL,
    "flatAmount" INTEGER,
    "percentRate" INTEGER,
    "computedMin" INTEGER NOT NULL,
    "computedMax" INTEGER NOT NULL,
    "isVat" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "stageKind" "PaymentStageKind" NOT NULL,
    "percentage" INTEGER NOT NULL,
    "dueText" TEXT NOT NULL,
    "amountMin" INTEGER NOT NULL,
    "amountMax" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractDraft" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "caseMatterId" TEXT,
    "status" "ContractDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "scopeText" TEXT,
    "paymentSummary" TEXT,
    "successFeeRestricted" BOOLEAN NOT NULL DEFAULT false,
    "specialTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseRecord" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "quoteId" TEXT,
    "contractDraftId" TEXT,
    "currentStage" "CaseStage" NOT NULL DEFAULT 'CONTRACT_PREPARATION',
    "bridgeWorkflowStatus" "BridgeWorkflowStatus" NOT NULL DEFAULT 'CASE_CARD_CREATED',
    "bridgeReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "bridgeMustVerify" TEXT NOT NULL DEFAULT '[]',
    "bridgeMustVerifySources" TEXT NOT NULL DEFAULT '[]',
    "bridgeRiskFlags" TEXT NOT NULL DEFAULT '[]',
    "bridgePractitionerGuide" TEXT,
    "bridgeCaseOutlook" TEXT,
    "dueDate" TIMESTAMP(3),
    "internalMemo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseMatter" (
    "id" TEXT NOT NULL,
    "caseNo" TEXT,
    "title" TEXT NOT NULL,
    "matterType" TEXT NOT NULL,
    "status" "CaseMatterStatus" NOT NULL DEFAULT 'INTAKE_REVIEW',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NORMAL',
    "priority" "CasePriority" NOT NULL DEFAULT 'NORMAL',
    "inquiryId" TEXT,
    "legacyCaseRecordId" TEXT,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "nextActionAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "summary" TEXT,
    "internalMemo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseMatter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseParty" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "role" "CasePartyRole" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "organization" TEXT,
    "nationality" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequiredDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" "RequiredDocumentStatus" NOT NULL DEFAULT 'NEEDED',
    "dueDate" TIMESTAMP(3),
    "requestedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequiredDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "requiredDocId" TEXT,
    "title" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "status" "CaseDocumentStatus" NOT NULL DEFAULT 'RECEIVED',
    "currentVersionId" TEXT,
    "storageKey" TEXT,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "checksum" TEXT,
    "uploadedBy" TEXT,
    "receivedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "status" "DocumentVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "storageKey" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "checksum" TEXT,
    "changeNote" TEXT,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionPackage" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "SubmissionPackageStatus" NOT NULL DEFAULT 'DRAFT',
    "targetAgency" TEXT,
    "targetOffice" TEXT,
    "preparedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionPackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionId" TEXT,
    "orderNo" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionPackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencySubmission" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "packageId" TEXT,
    "agencyName" TEXT NOT NULL,
    "officeName" TEXT,
    "method" "SubmissionMethod" NOT NULL,
    "status" "AgencySubmissionStatus" NOT NULL DEFAULT 'READY',
    "submittedAt" TIMESTAMP(3),
    "receiptNo" TEXT,
    "receiptFileKey" TEXT,
    "resultStatus" TEXT,
    "resultReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplementRequest" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "submissionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SupplementStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "requestedDocsJson" TEXT,
    "responseNote" TEXT,
    "responsePackageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseTask" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT,
    "caseId" TEXT,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "taskType" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "status" "CaseTaskStatus" NOT NULL DEFAULT 'TODO',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "mustVerify" TEXT NOT NULL DEFAULT '[]',
    "riskFlags" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "priority" "CaseTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "dueDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceVerificationTask" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "caseId" TEXT,
    "documentDraftId" TEXT,
    "messageDraftId" TEXT,
    "title" TEXT NOT NULL,
    "authorityBucket" TEXT,
    "sourceLabel" TEXT NOT NULL,
    "sourceCitation" TEXT,
    "notes" TEXT,
    "status" "WorkflowTaskStatus" NOT NULL DEFAULT 'OPEN',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "mustVerify" TEXT NOT NULL DEFAULT '[]',
    "riskFlags" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'lawbot_bridge',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SourceVerificationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequestTask" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "caseId" TEXT,
    "title" TEXT NOT NULL,
    "documentLabel" TEXT NOT NULL,
    "notes" TEXT,
    "status" "WorkflowTaskStatus" NOT NULL DEFAULT 'OPEN',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "mustVerify" TEXT NOT NULL DEFAULT '[]',
    "riskFlags" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'lawbot_bridge',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentRequestTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentDraft" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "caseId" TEXT,
    "draftType" TEXT NOT NULL,
    "title" TEXT,
    "bodyJson" TEXT NOT NULL DEFAULT '{}',
    "status" "WorkflowDraftStatus" NOT NULL DEFAULT 'DRAFT_CREATED',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "mustVerify" TEXT NOT NULL DEFAULT '[]',
    "mustVerifySources" TEXT NOT NULL DEFAULT '[]',
    "riskFlags" TEXT NOT NULL DEFAULT '[]',
    "practitionerGuide" TEXT,
    "caseOutlook" TEXT,
    "source" TEXT NOT NULL DEFAULT 'lawbot_bridge',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageDraft" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "caseId" TEXT,
    "messageKind" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "status" "WorkflowDraftStatus" NOT NULL DEFAULT 'DRAFT_CREATED',
    "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "mustVerify" TEXT NOT NULL DEFAULT '[]',
    "mustVerifySources" TEXT NOT NULL DEFAULT '[]',
    "riskFlags" TEXT NOT NULL DEFAULT '[]',
    "practitionerGuide" TEXT,
    "caseOutlook" TEXT,
    "source" TEXT NOT NULL DEFAULT 'lawbot_bridge',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "MessageDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "message" TEXT NOT NULL,
    "payloadJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyImportLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "payloadJson" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LegacyImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_legacyId_key" ON "ServiceType"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingOption_legacyId_key" ON "PricingOption"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingRule_code_key" ON "PricingRule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ContractDraft_quoteId_key" ON "ContractDraft"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseRecord_caseNumber_key" ON "CaseRecord"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CaseRecord_quoteId_key" ON "CaseRecord"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseRecord_contractDraftId_key" ON "CaseRecord"("contractDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseMatter_caseNo_key" ON "CaseMatter"("caseNo");

-- CreateIndex
CREATE UNIQUE INDEX "CaseMatter_legacyCaseRecordId_key" ON "CaseMatter"("legacyCaseRecordId");

-- CreateIndex
CREATE INDEX "CaseMatter_status_idx" ON "CaseMatter"("status");

-- CreateIndex
CREATE INDEX "CaseMatter_matterType_idx" ON "CaseMatter"("matterType");

-- CreateIndex
CREATE INDEX "CaseMatter_dueDate_idx" ON "CaseMatter"("dueDate");

-- CreateIndex
CREATE INDEX "CaseMatter_nextActionAt_idx" ON "CaseMatter"("nextActionAt");

-- CreateIndex
CREATE INDEX "CaseMatter_priority_idx" ON "CaseMatter"("priority");

-- CreateIndex
CREATE INDEX "CaseParty_caseId_idx" ON "CaseParty"("caseId");

-- CreateIndex
CREATE INDEX "CaseParty_role_idx" ON "CaseParty"("role");

-- CreateIndex
CREATE INDEX "RequiredDocument_caseId_idx" ON "RequiredDocument"("caseId");

-- CreateIndex
CREATE INDEX "RequiredDocument_status_idx" ON "RequiredDocument"("status");

-- CreateIndex
CREATE INDEX "RequiredDocument_dueDate_idx" ON "RequiredDocument"("dueDate");

-- CreateIndex
CREATE INDEX "CaseDocument_caseId_idx" ON "CaseDocument"("caseId");

-- CreateIndex
CREATE INDEX "CaseDocument_requiredDocId_idx" ON "CaseDocument"("requiredDocId");

-- CreateIndex
CREATE INDEX "CaseDocument_status_idx" ON "CaseDocument"("status");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "DocumentVersion_status_idx" ON "DocumentVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_versionNo_key" ON "DocumentVersion"("documentId", "versionNo");

-- CreateIndex
CREATE INDEX "SubmissionPackage_caseId_idx" ON "SubmissionPackage"("caseId");

-- CreateIndex
CREATE INDEX "SubmissionPackage_status_idx" ON "SubmissionPackage"("status");

-- CreateIndex
CREATE INDEX "SubmissionPackageItem_packageId_idx" ON "SubmissionPackageItem"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionPackageItem_packageId_documentId_key" ON "SubmissionPackageItem"("packageId", "documentId");

-- CreateIndex
CREATE INDEX "AgencySubmission_caseId_idx" ON "AgencySubmission"("caseId");

-- CreateIndex
CREATE INDEX "AgencySubmission_status_idx" ON "AgencySubmission"("status");

-- CreateIndex
CREATE INDEX "AgencySubmission_submittedAt_idx" ON "AgencySubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "SupplementRequest_caseId_idx" ON "SupplementRequest"("caseId");

-- CreateIndex
CREATE INDEX "SupplementRequest_status_idx" ON "SupplementRequest"("status");

-- CreateIndex
CREATE INDEX "SupplementRequest_dueDate_idx" ON "SupplementRequest"("dueDate");

-- CreateIndex
CREATE INDEX "CaseTask_inquiryId_status_idx" ON "CaseTask"("inquiryId", "status");

-- CreateIndex
CREATE INDEX "CaseTask_caseId_idx" ON "CaseTask"("caseId");

-- CreateIndex
CREATE INDEX "CaseTask_status_idx" ON "CaseTask"("status");

-- CreateIndex
CREATE INDEX "CaseTask_dueDate_idx" ON "CaseTask"("dueDate");

-- CreateIndex
CREATE INDEX "SourceVerificationTask_inquiryId_status_idx" ON "SourceVerificationTask"("inquiryId", "status");

-- CreateIndex
CREATE INDEX "SourceVerificationTask_caseId_status_idx" ON "SourceVerificationTask"("caseId", "status");

-- CreateIndex
CREATE INDEX "SourceVerificationTask_documentDraftId_idx" ON "SourceVerificationTask"("documentDraftId");

-- CreateIndex
CREATE INDEX "SourceVerificationTask_messageDraftId_idx" ON "SourceVerificationTask"("messageDraftId");

-- CreateIndex
CREATE INDEX "DocumentRequestTask_inquiryId_status_idx" ON "DocumentRequestTask"("inquiryId", "status");

-- CreateIndex
CREATE INDEX "DocumentRequestTask_caseId_status_idx" ON "DocumentRequestTask"("caseId", "status");

-- CreateIndex
CREATE INDEX "DocumentDraft_inquiryId_status_idx" ON "DocumentDraft"("inquiryId", "status");

-- CreateIndex
CREATE INDEX "DocumentDraft_caseId_status_idx" ON "DocumentDraft"("caseId", "status");

-- CreateIndex
CREATE INDEX "MessageDraft_inquiryId_status_idx" ON "MessageDraft"("inquiryId", "status");

-- CreateIndex
CREATE INDEX "MessageDraft_caseId_status_idx" ON "MessageDraft"("caseId", "status");

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_idx" ON "CaseEvent"("caseId");

-- CreateIndex
CREATE INDEX "CaseEvent_eventType_idx" ON "CaseEvent"("eventType");

-- CreateIndex
CREATE INDEX "CaseEvent_createdAt_idx" ON "CaseEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_caseMatterId_fkey" FOREIGN KEY ("caseMatterId") REFERENCES "CaseMatter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAdjustment" ADD CONSTRAINT "QuoteAdjustment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAdjustment" ADD CONSTRAINT "QuoteAdjustment_pricingOptionId_fkey" FOREIGN KEY ("pricingOptionId") REFERENCES "PricingOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractDraft" ADD CONSTRAINT "ContractDraft_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractDraft" ADD CONSTRAINT "ContractDraft_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractDraft" ADD CONSTRAINT "ContractDraft_caseMatterId_fkey" FOREIGN KEY ("caseMatterId") REFERENCES "CaseMatter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_contractDraftId_fkey" FOREIGN KEY ("contractDraftId") REFERENCES "ContractDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseMatter" ADD CONSTRAINT "CaseMatter_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseMatter" ADD CONSTRAINT "CaseMatter_legacyCaseRecordId_fkey" FOREIGN KEY ("legacyCaseRecordId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseParty" ADD CONSTRAINT "CaseParty_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequiredDocument" ADD CONSTRAINT "RequiredDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_requiredDocId_fkey" FOREIGN KEY ("requiredDocId") REFERENCES "RequiredDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CaseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionPackage" ADD CONSTRAINT "SubmissionPackage_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionPackageItem" ADD CONSTRAINT "SubmissionPackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubmissionPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionPackageItem" ADD CONSTRAINT "SubmissionPackageItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CaseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionPackageItem" ADD CONSTRAINT "SubmissionPackageItem_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySubmission" ADD CONSTRAINT "AgencySubmission_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySubmission" ADD CONSTRAINT "AgencySubmission_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubmissionPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementRequest" ADD CONSTRAINT "SupplementRequest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementRequest" ADD CONSTRAINT "SupplementRequest_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AgencySubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTask" ADD CONSTRAINT "CaseTask_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTask" ADD CONSTRAINT "CaseTask_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceVerificationTask" ADD CONSTRAINT "SourceVerificationTask_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceVerificationTask" ADD CONSTRAINT "SourceVerificationTask_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceVerificationTask" ADD CONSTRAINT "SourceVerificationTask_documentDraftId_fkey" FOREIGN KEY ("documentDraftId") REFERENCES "DocumentDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceVerificationTask" ADD CONSTRAINT "SourceVerificationTask_messageDraftId_fkey" FOREIGN KEY ("messageDraftId") REFERENCES "MessageDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequestTask" ADD CONSTRAINT "DocumentRequestTask_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequestTask" ADD CONSTRAINT "DocumentRequestTask_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentDraft" ADD CONSTRAINT "DocumentDraft_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentDraft" ADD CONSTRAINT "DocumentDraft_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDraft" ADD CONSTRAINT "MessageDraft_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDraft" ADD CONSTRAINT "MessageDraft_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseMatter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

