import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { Prisma } from "@generated/prisma-client/client";

const schemaPaths = [
  "prisma/schema.prisma",
  "prisma/schema.postgresql.prisma",
  "prisma/schema.sqlite.prisma"
];

const sensitiveFieldNames = [
  "passportNumber",
  "alienRegistrationNumber",
  "fullAddress",
  "familyMemberIdentifier",
  "rawViolationRecord",
  "uploadedDispositionDocument"
];

const expectedDeadlineFields = [
  "dispositionDate",
  "noticeDate",
  "serviceDate",
  "appealDeadline",
  "departureDeadline",
  "detentionStartDate",
  "stayExpiryDate",
  "submissionDeadline",
  "supplementDeadline",
  "resultExpectedDate"
];

const include = {
  immigrationDetail: true
} satisfies Prisma.CaseMatterInclude;

const createArgs = {
  data: {
    caseMatter: {
      connect: {
        id: "case_test"
      }
    },
    dispositionType: "DEPORTATION_ORDER",
    serviceDate: new Date("2026-05-17T00:00:00.000Z"),
    appealDeadline: new Date("2026-05-24T00:00:00.000Z"),
    nationality: "QA",
    currentStayStatus: "QA_STATUS",
    familyInKoreaSummary: "QA summary only"
  }
} satisfies Prisma.ImmigrationCaseDetailCreateArgs;

assert.equal(include.immigrationDetail, true);
assert.equal("scopeReviewRequired" in createArgs.data, false);
assert.equal("attorneyScopeRisk" in createArgs.data, false);
assert.equal("officialFormCheckRequired" in createArgs.data, false);

for (const schemaPath of schemaPaths) {
  const schema = readFileSync(schemaPath, "utf8");

  assert.match(schema, /model ImmigrationCaseDetail \{/);
  assert.match(schema, /immigrationDetail\s+ImmigrationCaseDetail\?/);
  assert.match(schema, /caseId\s+String\s+@unique/);
  assert.match(schema, /caseMatter\s+CaseMatter\s+@relation\(fields: \[caseId\], references: \[id\], onDelete: Cascade\)/);

  for (const fieldName of expectedDeadlineFields) {
    assert.match(schema, new RegExp(`${fieldName}\\s+DateTime\\?`), `${schemaPath} should include ${fieldName}`);
  }

  assert.match(schema, /scopeReviewRequired\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /attorneyScopeRisk\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /officialFormCheckRequired\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /@@index\(\[dispositionType\]\)/);
  assert.match(schema, /@@index\(\[appealDeadline\]\)/);
  assert.match(schema, /@@index\(\[departureDeadline\]\)/);
  assert.match(schema, /@@index\(\[stayExpiryDate\]\)/);
  assert.match(schema, /@@index\(\[deadlineVerifiedAt\]\)/);

  for (const sensitiveFieldName of sensitiveFieldNames) {
    assert.doesNotMatch(schema, new RegExp(sensitiveFieldName), `${schemaPath} should not include ${sensitiveFieldName}`);
  }
}

const migration = readFileSync("prisma/migrations/20260517001500_add_immigration_case_detail/migration.sql", "utf8");
assert.match(migration, /CREATE TABLE "ImmigrationCaseDetail"/);
assert.match(migration, /"scopeReviewRequired" BOOLEAN NOT NULL DEFAULT true/);
assert.match(migration, /"attorneyScopeRisk" BOOLEAN NOT NULL DEFAULT false/);
assert.match(migration, /"officialFormCheckRequired" BOOLEAN NOT NULL DEFAULT true/);
assert.match(migration, /ON DELETE CASCADE/);

for (const sensitiveFieldName of sensitiveFieldNames) {
  assert.doesNotMatch(migration, new RegExp(sensitiveFieldName), `migration should not include ${sensitiveFieldName}`);
}

console.log("immigration case detail schema tests passed");
