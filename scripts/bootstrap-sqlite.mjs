import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function resolveSqlitePath(databaseUrl) {
  if (!databaseUrl?.startsWith("file:")) {
    throw new Error(`Unsupported DATABASE_URL: ${databaseUrl}`);
  }

  const rawPath = databaseUrl.slice("file:".length);

  if (/^[A-Za-z]:\//.test(rawPath)) {
    return rawPath.replaceAll("/", path.sep);
  }

  return path.resolve(process.cwd(), rawPath);
}

loadEnvFile(path.join(process.cwd(), ".env"));

if ((process.env.DATABASE_PROVIDER || "").trim() === "postgresql") {
  throw new Error("db:init only supports local SQLite. Use SQLite env values for local development.");
}

const dbPath = resolveSqlitePath(process.env.DATABASE_URL);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA foreign_keys = ON`);

// Keep the SQLite bootstrap aligned with prisma/schema.prisma so the app remains runnable
// even when Prisma's schema engine has trouble on certain Windows environments.
db.exec(`
CREATE TABLE IF NOT EXISTS "Inquiry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "inquiryType" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "urgencyLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
  "classificationConfidence" REAL NOT NULL DEFAULT 0,
  "qualificationScore" INTEGER NOT NULL DEFAULT 0,
  "preferredLanguage" TEXT NOT NULL DEFAULT 'KO',
  "clientType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
  "contactName" TEXT NOT NULL,
  "organizationName" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "nationality" TEXT,
  "currentStatus" TEXT,
  "requestedOutcome" TEXT,
  "requestedInquiryType" TEXT,
  "declaredUrgency" TEXT,
  "documentCountry" TEXT,
  "targetAgency" TEXT,
  "hasPreparedDocuments" BOOLEAN NOT NULL DEFAULT 0,
  "needsTranslation" BOOLEAN NOT NULL DEFAULT 0,
  "isCorporateRequest" BOOLEAN NOT NULL DEFAULT 0,
  "dueDate" DATETIME,
  "assignee" TEXT,
  "internalMemo" TEXT,
  "consultationRequired" BOOLEAN NOT NULL DEFAULT 0,
  "riskComplexityHint" TEXT,
  "precheckRecommendedDocs" TEXT NOT NULL DEFAULT '[]',
  "wantsCallback" BOOLEAN NOT NULL DEFAULT 0,
  "consentToPrivacy" BOOLEAN NOT NULL DEFAULT 0,
  "intakeSource" TEXT NOT NULL DEFAULT 'website',
  "generatedSummary" TEXT NOT NULL,
  "generatedGuidance" TEXT NOT NULL,
  "generatedReceiptMessage" TEXT NOT NULL,
  "classificationReason" TEXT NOT NULL,
  "recommendedNextStep" TEXT NOT NULL,
  "serviceTags" TEXT NOT NULL DEFAULT '[]'
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "ServiceType" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "legacyId" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "minPrice" INTEGER NOT NULL,
  "maxPrice" INTEGER NOT NULL,
  "isAppeal" BOOLEAN NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "source" TEXT NOT NULL DEFAULT 'legacy-admin-suite',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "PricingOption" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "legacyId" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "optionType" TEXT NOT NULL,
  "flatAmount" INTEGER,
  "percentRate" INTEGER,
  "unitLabel" TEXT,
  "isVat" BOOLEAN NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "source" TEXT NOT NULL DEFAULT 'legacy-admin-suite',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "PricingRule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "ruleType" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "numericValue" INTEGER,
  "percentValue" INTEGER,
  "jsonValue" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "source" TEXT NOT NULL DEFAULT 'legacy-admin-suite',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "Quote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "inquiryId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "selectedServiceLegacyIds" TEXT NOT NULL DEFAULT '[]',
  "selectedOptionLegacyIds" TEXT NOT NULL DEFAULT '[]',
  "urgencyRuleCode" TEXT NOT NULL,
  "consultRuleCode" TEXT NOT NULL,
  "paymentRuleCode" TEXT NOT NULL DEFAULT 'PAYMENT_STANDARD',
  "rangeMode" BOOLEAN NOT NULL DEFAULT 1,
  "serviceBaseMin" INTEGER NOT NULL DEFAULT 0,
  "serviceBaseMax" INTEGER NOT NULL DEFAULT 0,
  "subtotalMin" INTEGER NOT NULL DEFAULT 0,
  "subtotalMax" INTEGER NOT NULL DEFAULT 0,
  "vatAmountMin" INTEGER NOT NULL DEFAULT 0,
  "vatAmountMax" INTEGER NOT NULL DEFAULT 0,
  "totalMin" INTEGER NOT NULL DEFAULT 0,
  "totalMax" INTEGER NOT NULL DEFAULT 0,
  "consultFee" INTEGER NOT NULL DEFAULT 0,
  "successFeeRestricted" BOOLEAN NOT NULL DEFAULT 0,
  "draftNotes" TEXT,
  "calculationSummary" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "QuoteLineItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "quoteId" TEXT NOT NULL,
  "serviceTypeId" TEXT,
  "kind" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "amountMin" INTEGER NOT NULL,
  "amountMax" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isManual" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE SET NULL ON UPDATE CASCADE
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "QuoteAdjustment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "quoteId" TEXT NOT NULL,
  "pricingOptionId" TEXT,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "optionType" TEXT NOT NULL,
  "flatAmount" INTEGER,
  "percentRate" INTEGER,
  "computedMin" INTEGER NOT NULL,
  "computedMax" INTEGER NOT NULL,
  "isVat" BOOLEAN NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isManual" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("pricingOptionId") REFERENCES "PricingOption"("id") ON DELETE SET NULL ON UPDATE CASCADE
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "PaymentPlan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "quoteId" TEXT NOT NULL,
  "stageKind" TEXT NOT NULL,
  "percentage" INTEGER NOT NULL,
  "dueText" TEXT NOT NULL,
  "amountMin" INTEGER NOT NULL,
  "amountMax" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "ContractDraft" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "inquiryId" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "title" TEXT NOT NULL,
  "bodyText" TEXT NOT NULL,
  "scopeText" TEXT,
  "paymentSummary" TEXT,
  "successFeeRestricted" BOOLEAN NOT NULL DEFAULT 0,
  "specialTerms" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "CaseRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "caseNumber" TEXT NOT NULL UNIQUE,
  "inquiryId" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL UNIQUE,
  "contractDraftId" TEXT UNIQUE,
  "currentStage" TEXT NOT NULL DEFAULT 'CONTRACT_PREPARATION',
  "dueDate" DATETIME,
  "filingDeadline" DATETIME,
  "supplementDeadline" DATETIME,
  "stayExpirationDate" DATETIME,
  "internalDeadline" DATETIME,
  "internalMemo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("contractDraftId") REFERENCES "ContractDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "CaseDocumentItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "isRequired" BOOLEAN NOT NULL DEFAULT 1,
  "isReceived" BOOLEAN NOT NULL DEFAULT 0,
  "receivedAt" DATETIME,
  "note" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE
)
`);

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS "CaseDocumentItem_caseId_documentType_key"
ON "CaseDocumentItem"("caseId", "documentType")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "CaseStageLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  "fromStage" TEXT,
  "toStage" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "CaseDocumentFile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  "caseDocumentItemId" TEXT,
  "originalFilename" TEXT NOT NULL,
  "storedFilename" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  "isCurrentVersion" BOOLEAN NOT NULL DEFAULT 1,
  "versionNumber" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("caseDocumentItemId") REFERENCES "CaseDocumentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
)
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "CaseDocumentFile_caseId_uploadedAt_idx"
ON "CaseDocumentFile"("caseId", "uploadedAt")
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "CaseDocumentFile_caseDocumentItemId_versionNumber_idx"
ON "CaseDocumentFile"("caseDocumentItemId", "versionNumber")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "SubmissionPackage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  "packageNumber" TEXT NOT NULL,
  "packageLabel" TEXT,
  "submittedTo" TEXT,
  "submittedAt" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE
)
`);

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS "SubmissionPackage_caseId_packageNumber_key"
ON "SubmissionPackage"("caseId", "packageNumber")
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "SubmissionPackage_caseId_createdAt_idx"
ON "SubmissionPackage"("caseId", "createdAt")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "SubmissionPackageItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "submissionPackageId" TEXT NOT NULL,
  "caseDocumentItemId" TEXT NOT NULL,
  "caseDocumentFileId" TEXT NOT NULL,
  "labelSnapshot" TEXT NOT NULL,
  "versionNumberSnapshot" INTEGER NOT NULL,
  "documentTypeSnapshot" TEXT NOT NULL,
  "filenameSnapshot" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("submissionPackageId") REFERENCES "SubmissionPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("caseDocumentItemId") REFERENCES "CaseDocumentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("caseDocumentFileId") REFERENCES "CaseDocumentFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE
)
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "SubmissionPackageItem_submissionPackageId_caseDocumentItemId_idx"
ON "SubmissionPackageItem"("submissionPackageId", "caseDocumentItemId")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "SupplementRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  "submissionPackageId" TEXT,
  "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" DATETIME,
  "requestedBy" TEXT,
  "summary" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("submissionPackageId") REFERENCES "SubmissionPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE
)
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "SupplementRequest_caseId_requestedAt_idx"
ON "SupplementRequest"("caseId", "requestedAt")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "SupplementRequestItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "supplementRequestId" TEXT NOT NULL,
  "caseDocumentItemId" TEXT NOT NULL,
  "labelSnapshot" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("supplementRequestId") REFERENCES "SupplementRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("caseDocumentItemId") REFERENCES "CaseDocumentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE
)
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "SupplementRequestItem_supplementRequestId_sortOrder_idx"
ON "SupplementRequestItem"("supplementRequestId", "sortOrder")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "FollowUpAction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "title" TEXT NOT NULL,
  "note" TEXT,
  "dueDate" DATETIME,
  "messageDraft" TEXT NOT NULL,
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE
)
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "FollowUpAction_caseId_status_dueDate_idx"
ON "FollowUpAction"("caseId", "status", "dueDate")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "LegacyImportLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "source" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "payloadJson" TEXT,
  "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdCount" INTEGER NOT NULL DEFAULT 0
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "UserSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
)
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "UserSession_userId_expiresAt_idx"
ON "UserSession"("userId", "expiresAt")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorUserId" TEXT,
  "actionType" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
)
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "ExternalIndicatorObservation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "observationDate" DATETIME NOT NULL,
  "indicatorKey" TEXT NOT NULL,
  "category" TEXT,
  "numericValue" REAL NOT NULL,
  "source" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalIndicatorObservation_observationDate_indicatorKey_category_key"
ON "ExternalIndicatorObservation"("observationDate", "indicatorKey", "category")
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "ExternalIndicatorObservation_indicatorKey_observationDate_idx"
ON "ExternalIndicatorObservation"("indicatorKey", "observationDate")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "ForecastEventFlag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventDate" DATETIME NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "category" TEXT,
  "impactFlag" BOOLEAN NOT NULL DEFAULT 1,
  "memo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "ForecastEventFlag_category_eventDate_idx"
ON "ForecastEventFlag"("category", "eventDate")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "WeeklyForecastDataset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "weekStartDate" DATETIME NOT NULL,
  "category" TEXT NOT NULL,
  "channel" TEXT,
  "inquiryCount" INTEGER NOT NULL DEFAULT 0,
  "contractCount" INTEGER NOT NULL DEFAULT 0,
  "avgProcessingDays" REAL,
  "revisionRequestCount" INTEGER NOT NULL DEFAULT 0,
  "externalIndicatorsJson" TEXT NOT NULL DEFAULT '{}',
  "eventFlagsJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyForecastDataset_weekStartDate_category_channel_key"
ON "WeeklyForecastDataset"("weekStartDate", "category", "channel")
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "WeeklyForecastDataset_category_weekStartDate_idx"
ON "WeeklyForecastDataset"("category", "weekStartDate")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "DemandForecastRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "targetMetric" TEXT NOT NULL,
  "targetCategory" TEXT NOT NULL,
  "targetChannel" TEXT,
  "horizonWeeks" INTEGER NOT NULL,
  "modelName" TEXT NOT NULL,
  "modelVersion" TEXT,
  "sourceWindowWeeks" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "contextJson" TEXT,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "DemandForecastRun_targetMetric_targetCategory_createdAt_idx"
ON "DemandForecastRun"("targetMetric", "targetCategory", "createdAt")
`);

db.exec(`
CREATE TABLE IF NOT EXISTS "DemandForecastPoint" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "targetWeekStart" DATETIME NOT NULL,
  "predictedValue" REAL NOT NULL,
  "lowerBound" REAL,
  "upperBound" REAL,
  "actualValue" REAL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("runId") REFERENCES "DemandForecastRun"("id") ON DELETE CASCADE ON UPDATE CASCADE
)
`);

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS "DemandForecastPoint_runId_targetWeekStart_key"
ON "DemandForecastPoint"("runId", "targetWeekStart")
`);

db.exec(`
CREATE INDEX IF NOT EXISTS "DemandForecastPoint_targetWeekStart_idx"
ON "DemandForecastPoint"("targetWeekStart")
`);

const columns = db
  .prepare(`PRAGMA table_info("Inquiry")`)
  .all()
  .map((column) => column.name);

if (!columns.includes("assignee")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "assignee" TEXT`);
}

if (!columns.includes("internalMemo")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "internalMemo" TEXT`);
}

if (!columns.includes("requestedOutcome")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "requestedOutcome" TEXT`);
}

if (!columns.includes("requestedInquiryType")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "requestedInquiryType" TEXT`);
}

if (!columns.includes("declaredUrgency")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "declaredUrgency" TEXT`);
}

if (!columns.includes("hasPreparedDocuments")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "hasPreparedDocuments" BOOLEAN NOT NULL DEFAULT 0`);
}

if (!columns.includes("needsTranslation")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "needsTranslation" BOOLEAN NOT NULL DEFAULT 0`);
}

if (!columns.includes("isCorporateRequest")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "isCorporateRequest" BOOLEAN NOT NULL DEFAULT 0`);
}

if (!columns.includes("consultationRequired")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "consultationRequired" BOOLEAN NOT NULL DEFAULT 0`);
}

if (!columns.includes("riskComplexityHint")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "riskComplexityHint" TEXT`);
}

if (!columns.includes("precheckRecommendedDocs")) {
  db.exec(`ALTER TABLE "Inquiry" ADD COLUMN "precheckRecommendedDocs" TEXT NOT NULL DEFAULT '[]'`);
}

const quoteColumns = db
  .prepare(`PRAGMA table_info("Quote")`)
  .all()
  .map((column) => column.name);

if (quoteColumns.length > 0 && !quoteColumns.includes("paymentRuleCode")) {
  db.exec(`ALTER TABLE "Quote" ADD COLUMN "paymentRuleCode" TEXT NOT NULL DEFAULT 'PAYMENT_STANDARD'`);
}

const caseColumns = db
  .prepare(`PRAGMA table_info("CaseRecord")`)
  .all()
  .map((column) => column.name);

if (caseColumns.length > 0 && !caseColumns.includes("filingDeadline")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "filingDeadline" DATETIME`);
}

if (caseColumns.length > 0 && !caseColumns.includes("supplementDeadline")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "supplementDeadline" DATETIME`);
}

if (caseColumns.length > 0 && !caseColumns.includes("stayExpirationDate")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "stayExpirationDate" DATETIME`);
}

if (caseColumns.length > 0 && !caseColumns.includes("internalDeadline")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "internalDeadline" DATETIME`);
}

if (caseColumns.length > 0 && !caseColumns.includes("closedAt")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "closedAt" DATETIME`);
}

if (caseColumns.length > 0 && !caseColumns.includes("closeReason")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "closeReason" TEXT`);
}

if (caseColumns.length > 0 && !caseColumns.includes("outcomeSummary")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "outcomeSummary" TEXT`);
}

if (caseColumns.length > 0 && !caseColumns.includes("nextFollowUpDate")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "nextFollowUpDate" DATETIME`);
}

if (caseColumns.length > 0 && !caseColumns.includes("clientRelationshipStatus")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "clientRelationshipStatus" TEXT NOT NULL DEFAULT 'NEUTRAL'`);
}

if (caseColumns.length > 0 && !caseColumns.includes("reviewRequestedAt")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "reviewRequestedAt" DATETIME`);
}

if (caseColumns.length > 0 && !caseColumns.includes("reviewCompletedAt")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "reviewCompletedAt" DATETIME`);
}

if (caseColumns.length > 0 && !caseColumns.includes("referralEligible")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "referralEligible" BOOLEAN NOT NULL DEFAULT 0`);
}

if (caseColumns.length > 0 && !caseColumns.includes("reengagementEligible")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "reengagementEligible" BOOLEAN NOT NULL DEFAULT 0`);
}

if (caseColumns.length > 0 && !caseColumns.includes("lastFollowUpAt")) {
  db.exec(`ALTER TABLE "CaseRecord" ADD COLUMN "lastFollowUpAt" DATETIME`);
}

db.close();
console.log(`SQLite initialized at ${dbPath}`);
