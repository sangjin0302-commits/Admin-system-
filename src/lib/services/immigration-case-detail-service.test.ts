import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { updateImmigrationCaseDetailSchema } from "@/lib/validation/case-matter";

const serviceSource = readFileSync(
  join(process.cwd(), "src/lib/services/immigration-case-detail-service.ts"),
  "utf8"
);
const routeSource = readFileSync(
  join(
    process.cwd(),
    "src/app/api/admin/case-matters/[id]/immigration-detail/route.ts"
  ),
  "utf8"
);
const validationSource = readFileSync(
  join(process.cwd(), "src/lib/validation/case-matter.ts"),
  "utf8"
);

const parsed = updateImmigrationCaseDetailSchema.parse({
  dispositionType: " VISA_ISSUANCE_SUPPORT ",
  serviceDate: "",
  submissionDeadline: "2026-05-20",
  resultExpectedDate: null,
  nationality: " QA ",
  currentStayStatus: " QA status ",
  familyInKoreaSummary: "",
  scopeReviewRequired: true,
  attorneyScopeRisk: false,
  officialFormCheckRequired: true,
  deadlineVerifiedAt: "2026-05-17",
  verifiedBy: " QA Operator ",
  actorName: " QA Operator ",
  expectedCaseUpdatedAt: "2026-05-17T00:00:00.000Z"
});

assert.equal(parsed.dispositionType, "VISA_ISSUANCE_SUPPORT");
assert.equal(parsed.serviceDate, null);
assert.equal(parsed.familyInKoreaSummary, null);
assert.equal(parsed.nationality, "QA");
assert.equal(parsed.verifiedBy, "QA Operator");

const sparseParsed = updateImmigrationCaseDetailSchema.parse({
  dispositionType: "ENTRY_BAN"
});
assert.equal(Object.hasOwn(sparseParsed, "serviceDate"), false);
assert.equal(Object.hasOwn(sparseParsed, "nationality"), false);

assert.throws(() =>
  updateImmigrationCaseDetailSchema.parse({
    serviceDate: "not-a-date"
  })
);

assert.throws(() =>
  updateImmigrationCaseDetailSchema.parse({
    currentStayStatus: "x".repeat(121)
  })
);

for (const forbiddenField of ["passportNumber", "alienRegistrationNumber", "fullAddress"]) {
  assert.throws(() =>
    updateImmigrationCaseDetailSchema.parse({
      [forbiddenField]: "do-not-store"
    })
  );
}

assert.match(validationSource, /updateImmigrationCaseDetailSchema/);
assert.match(validationSource, /\.strict\(\)/);
assert.doesNotMatch(
  validationSource,
  /passportNumber\s*:|alienRegistrationNumber\s*:|fullAddress\s*:/
);

assert.match(serviceSource, /export async function updateImmigrationCaseDetail/);
assert.match(serviceSource, /tx\.caseMatter\.findUnique/);
assert.match(serviceSource, /tx\.immigrationCaseDetail\.create/);
assert.match(serviceSource, /tx\.immigrationCaseDetail\.update/);
assert.match(serviceSource, /expectedUpdatedAt/);
assert.match(serviceSource, /expectedCaseUpdatedAt/);
assert.match(serviceSource, /ImmigrationCaseDetailConcurrentUpdateError/);
assert.match(serviceSource, /IMMIGRATION_CASE_DETAIL_UPDATED/);
assert.match(serviceSource, /tx\.caseEvent\.create/);
assert.match(serviceSource, /payloadJson: JSON\.stringify/);
assert.match(serviceSource, /dueDateSynced: false/);
assert.doesNotMatch(serviceSource, /caseMatter\.update\(\{[\s\S]*dueDate\s*:/);
assert.doesNotMatch(serviceSource, /passportNumber|alienRegistrationNumber|fullAddress/);

assert.match(routeSource, /export async function PATCH/);
assert.doesNotMatch(routeSource, /export async function GET/);
assert.match(routeSource, /updateImmigrationCaseDetailSchema/);
assert.match(routeSource, /updateImmigrationCaseDetail/);
assert.match(routeSource, /api\.ok\(\{ ok: true \}\)/);
assert.doesNotMatch(
  routeSource,
  /caseMatter\s*:|immigrationDetail\s*:|communicationLogs|internalMemo|payloadJson|ADMIN_BASIC_AUTH_PASSWORD|DATABASE_URL|RESEND_API_KEY|EMAIL_FROM/
);

console.log("immigration case detail service tests passed");
