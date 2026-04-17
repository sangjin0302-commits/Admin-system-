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
  "serviceTags" TEXT NOT NULL DEFAULT '[]',
  "lawbotLastAnalyzedAt" DATETIME,
  "lawbotSnapshotVersion" INTEGER NOT NULL DEFAULT 1,
  "lawbotSnapshotStatus" TEXT,
  "lawbotSnapshotSummary" TEXT,
  "lawbotSnapshotPayload" TEXT
)
`);

const inquiryColumns = new Set(
  db
    .prepare(`PRAGMA table_info("Inquiry")`)
    .all()
    .map((row) => String(row.name))
);

const inquiryColumnPatches = [
  [`"lawbotLastAnalyzedAt" DATETIME`, "lawbotLastAnalyzedAt"],
  [`"lawbotSnapshotVersion" INTEGER NOT NULL DEFAULT 1`, "lawbotSnapshotVersion"],
  [`"lawbotSnapshotStatus" TEXT`, "lawbotSnapshotStatus"],
  [`"lawbotSnapshotSummary" TEXT`, "lawbotSnapshotSummary"],
  [`"lawbotSnapshotPayload" TEXT`, "lawbotSnapshotPayload"]
];

for (const [definition, columnName] of inquiryColumnPatches) {
  if (!inquiryColumns.has(columnName)) {
    db.exec(`ALTER TABLE "Inquiry" ADD COLUMN ${definition}`);
  }
}

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
  "internalMemo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("contractDraftId") REFERENCES "ContractDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE
)
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

db.close();
console.log(`SQLite initialized at ${dbPath}`);
