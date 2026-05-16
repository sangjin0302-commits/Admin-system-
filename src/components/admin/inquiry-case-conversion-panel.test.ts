import assert from "node:assert/strict";

import {
  buildInquiryCaseConversionOptions,
  suggestMatterTypeForInquiryType
} from "@/components/admin/inquiry-case-conversion-panel";

const options = buildInquiryCaseConversionOptions();
assert.equal(options.length, 13);
assert.equal(new Set(options.map((option) => option.value)).size, options.length);
assert.ok(options.every((option) => option.label.trim().length > 0));
assert.ok(options.every((option) => option.description.trim().length > 0));
assert.ok(options.some((option) => option.value === "deportation_order_appeal"));
assert.ok(options.some((option) => option.value === "visa_issuance_support"));
assert.ok(options.some((option) => option.category === "immigration_appeal"));

assert.equal(suggestMatterTypeForInquiryType("FOREIGNER_VISA"), "visa_issuance_support");
assert.equal(suggestMatterTypeForInquiryType("IMMIGRATION_STAY"), "residence_status_document_support");
assert.equal(suggestMatterTypeForInquiryType("UNKNOWN"), "");
assert.equal(suggestMatterTypeForInquiryType("GENERAL_ADMIN_CIVIL"), "");

const serialized = JSON.stringify(options);
assert.doesNotMatch(serialized, /결과 보장|100% 허가|자동 제출|AI가 판단/);
assert.doesNotMatch(serialized, /guaranteed result|guarantee approval|automatic submission/i);

console.log("inquiry case conversion panel tests passed");
