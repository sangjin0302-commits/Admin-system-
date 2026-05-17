import assert from "node:assert/strict";

import {
  formatImmigrationDeadlineFieldLabel,
  getCriticalImmigrationDeadlineFieldsForMatterType,
  getImmigrationDeadlineFieldsForMatterType,
  getPrimaryDueDateCandidateFieldsForMatterType,
  IMMIGRATION_DEADLINE_FIELD_DEFINITIONS,
  IMMIGRATION_DEADLINE_PRIORITY,
  IMMIGRATION_MATTER_TYPE_DEADLINE_MAP,
  isImmigrationDeadlineField
} from "@/lib/immigration/immigration-deadline-field-map";

const fieldNames = IMMIGRATION_DEADLINE_FIELD_DEFINITIONS.map((definition) => definition.field);
assert.equal(new Set(fieldNames).size, fieldNames.length, "deadline field definitions should be unique");

assert.deepEqual(IMMIGRATION_DEADLINE_PRIORITY, [
  "appealDeadline",
  "departureDeadline",
  "supplementDeadline",
  "stayExpiryDate",
  "submissionDeadline"
]);

const deportationFields = getImmigrationDeadlineFieldsForMatterType("deportation_order_appeal");
assert.ok(deportationFields.some((definition) => definition.field === "serviceDate"));
assert.ok(deportationFields.some((definition) => definition.field === "appealDeadline"));

const departureFields = getImmigrationDeadlineFieldsForMatterType("departure_order_appeal");
assert.ok(departureFields.some((definition) => definition.field === "departureDeadline"));

const stayExtensionFields = getImmigrationDeadlineFieldsForMatterType("stay_extension_denial_appeal");
assert.ok(stayExtensionFields.some((definition) => definition.field === "stayExpiryDate"));

const visaFields = getImmigrationDeadlineFieldsForMatterType("visa_issuance_support");
assert.deepEqual(
  visaFields.map((definition) => definition.field),
  ["submissionDeadline", "resultExpectedDate"]
);

assert.deepEqual(getImmigrationDeadlineFieldsForMatterType("general_case_matter"), []);
assert.deepEqual(getCriticalImmigrationDeadlineFieldsForMatterType("general_case_matter"), []);
assert.deepEqual(getPrimaryDueDateCandidateFieldsForMatterType("general_case_matter"), []);

assert.equal(isImmigrationDeadlineField("appealDeadline"), true);
assert.equal(isImmigrationDeadlineField("unknownDeadline"), false);
assert.equal(formatImmigrationDeadlineFieldLabel("appealDeadline"), "불복/신청 기한");
assert.equal(formatImmigrationDeadlineFieldLabel("unknownDeadline"), "unknownDeadline");
assert.equal(formatImmigrationDeadlineFieldLabel(""), "-");

const criticalFields = getCriticalImmigrationDeadlineFieldsForMatterType("deportation_order_appeal").map(
  (definition) => definition.field
);
assert.ok(criticalFields.includes("serviceDate"));
assert.ok(criticalFields.includes("appealDeadline"));

const dueDateCandidates = getPrimaryDueDateCandidateFieldsForMatterType("departure_order_appeal").map(
  (definition) => definition.field
);
assert.ok(dueDateCandidates.includes("appealDeadline"));
assert.ok(dueDateCandidates.includes("departureDeadline"));

for (const [matterType, fields] of Object.entries(IMMIGRATION_MATTER_TYPE_DEADLINE_MAP)) {
  assert.ok(fields.length > 0, `${matterType} should have deadline fields`);
  for (const field of fields) {
    assert.ok(isImmigrationDeadlineField(field), `${matterType} should only use known deadline fields`);
  }
}

const serialized = JSON.stringify({
  definitions: IMMIGRATION_DEADLINE_FIELD_DEFINITIONS,
  map: IMMIGRATION_MATTER_TYPE_DEADLINE_MAP
});
assert.doesNotMatch(serialized, /결과 보장|100% 허가|즉시 해결|자동 제출|AI가 판단/);
assert.doesNotMatch(serialized, /auto-save|autosave|mutation|POST|PATCH|DELETE/i);
assert.doesNotMatch(serialized, /passportNumber|alienRegistrationNumber|외국인등록번호|여권번호/);

console.log("immigration deadline field map tests passed");
