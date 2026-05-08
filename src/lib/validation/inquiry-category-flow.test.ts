import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { toPublicInquiryResponse } from "@/app/api/inquiries/route-safe-v3";
import { getIntakeFormDisplaySnapshot } from "@/components/intake/intake-form-safe-v3";
import { parseCreateInquiryInput } from "@/lib/validation/inquiry-safe";
import {
  civilPetitionSubtypeValues,
  getLocalizedIntakeCategoryLabel,
  getLocalizedIntakeFieldLabel,
  getLocalizedIntakeOptionLabel,
  intakeCategoryDetailFields,
  intakeCategoryLabels,
  intakeCategoryValues
} from "@/types/intake-category";

const root = process.cwd();

const basePayload = {
  preferredLocale: "ko",
  clientType: "INDIVIDUAL",
  contactName: "Test Client",
  email: "client@example.com",
  phone: "010-0000-0000",
  title: "Public intake request",
  description: "This client needs help with an administrative matter and wants consultation.",
  requestedOutcome: "Review available options",
  declaredUrgency: "HIGH",
  consentToPrivacy: true,
  website: ""
} as const;

function assertNonEmptyValidationError(run: () => unknown) {
  assert.throws(run, (error) => error instanceof Error && error.message.length > 0);
}

assert.deepEqual(intakeCategoryValues, [
  "visa",
  "corporation",
  "administrative_appeal",
  "fact_finding_contract",
  "permit_license",
  "arabic_translation",
  "civil_petition"
]);
assert.equal(civilPetitionSubtypeValues.length >= 5, true);

assertNonEmptyValidationError(() => parseCreateInquiryInput(basePayload));

assertNonEmptyValidationError(() =>
  parseCreateInquiryInput({
    ...basePayload,
    category: "civil_petition",
    categoryDetails: {
      targetAgency: "District office"
    }
  })
);

const parsedVisa = parseCreateInquiryInput({
  ...basePayload,
  category: "visa",
  categoryDetails: {
    workType: "Change",
    nationality: "Egypt",
    currentVisaStatus: "D-10",
    desiredVisaType: "E-7",
    documentAvailability: "Documents available"
  }
});
assert.equal(parsedVisa.category, "visa");
assert.equal(parsedVisa.categoryDetails?.workType, "Change");
assert.deepEqual(parsedVisa.intakeTracking, {});

const parsedTrackedVisa = parseCreateInquiryInput({
  ...basePayload,
  category: "visa",
  categoryDetails: {
    workType: "Change"
  },
  intakeTracking: {
    source: "autosns",
    channel: "naver",
    practice_area: "middle_east_admin_business",
    content_id: "mic_46900181d72c",
    package_id: "mdri_7cc2f3c6648f_claude_v1",
    landing_url: "/intake?source=autosns",
    captured_at: "2026-05-08T00:00:00.000Z"
  }
});
assert.equal(parsedTrackedVisa.intakeTracking.intakeSource, "autosns");
assert.equal(parsedTrackedVisa.intakeTracking.intakeChannel, "naver");
assert.equal(parsedTrackedVisa.intakeTracking.intakePracticeArea, "middle_east_admin_business");
assert.equal(parsedTrackedVisa.intakeTracking.intakeContentId, "mic_46900181d72c");
assert.equal(parsedTrackedVisa.intakeTracking.intakePackageId, "mdri_7cc2f3c6648f_claude_v1");

const parsedCivilPetition = parseCreateInquiryInput({
  ...basePayload,
  category: "civil_petition",
  categoryDetails: {
    civilPetitionType: civilPetitionSubtypeValues[0],
    targetAgency: "District office",
    petitionTargetOrCase: "Vehicle registration support",
    currentStage: "Before filing"
  }
});
assert.equal(parsedCivilPetition.category, "civil_petition");
assert.equal(parsedCivilPetition.categoryDetails?.civilPetitionType, civilPetitionSubtypeValues[0]);

const arabicFields = intakeCategoryDetailFields.arabic_translation;
const arabicWorkType = arabicFields.find((field) => field.key === "workType");
const arabicInterpretationMethod = arabicFields.find((field) => field.key === "interpretationMethod");
const arabicSensitiveInfo = arabicFields.find((field) => field.key === "hasSensitiveInfo");
assert.ok(arabicWorkType);
assert.ok(arabicInterpretationMethod);
assert.ok(arabicSensitiveInfo);

const parsedArabic = parseCreateInquiryInput({
  ...basePayload,
  category: "arabic_translation",
  categoryDetails: {
    workType: arabicWorkType.options?.[1],
    languageDirection: arabicFields.find((field) => field.key === "languageDirection")?.options?.[0],
    interpretationMethod: arabicInterpretationMethod.options?.[2],
    hasSensitiveInfo: arabicSensitiveInfo.options?.[0]
  }
});
assert.equal(parsedArabic.category, "arabic_translation");
assert.equal(parsedArabic.categoryDetails?.hasSensitiveInfo, arabicSensitiveInfo.options?.[0]);

const publicResponse = toPublicInquiryResponse({
  publicTrackingCode: "20260427-AR-0014-Q8",
  communicationLogs: null
} as unknown as Parameters<typeof toPublicInquiryResponse>[0]);
assert.equal(publicResponse.received, true);
assert.equal(publicResponse.trackingCode, "20260427-AR-0014-Q8");

const publicResponseString = JSON.stringify(publicResponse);
for (const forbidden of [
  "inquiryId",
  "caseId",
  "workflowStatus",
  "bridgeWorkflowStatus",
  "lawbot",
  "Lawbot",
  "approvalGate",
  "documentDrafts",
  "messageDrafts"
]) {
  assert.equal(publicResponseString.includes(forbidden), false);
}

const englishIntakeSnapshot = getIntakeFormDisplaySnapshot("en");
assert.deepEqual(englishIntakeSnapshot.sectionHeadings, [
  "Select service type",
  "Contact and consultation details",
  "Service-specific questions",
  "Case summary and documents",
  "Consent and submission"
]);
assert.deepEqual(englishIntakeSnapshot.categoryLabels, [
  "Visa",
  "Corporate services",
  "Administrative appeal",
  "Fact investigation and contract drafting",
  "Permits and licenses",
  "Arabic translation and interpretation",
  "Other civil petitions"
]);

for (const label of [
  "Service type",
  "Interpretation method",
  "Contains sensitive information"
]) {
  assert.equal(englishIntakeSnapshot.arabicFieldLabels.includes(label), true);
}

for (const subtype of [
  "Vehicle registration",
  "General civil petition",
  "Grievance petition",
  "Information disclosure request"
]) {
  assert.equal(englishIntakeSnapshot.civilPetitionSubtypeLabels.includes(subtype), true);
}

assert.equal(
  englishIntakeSnapshot.completion.message,
  "Your request has been submitted. A staff member will review it and contact you."
);
assert.equal(englishIntakeSnapshot.completion.trackingNumber, "Tracking number");
assert.equal(
  englishIntakeSnapshot.completion.trackingHelp,
  "You can check your request status with your tracking number."
);

assert.equal(getLocalizedIntakeCategoryLabel("arabic_translation", "en"), "Arabic translation and interpretation");
assert.equal(getLocalizedIntakeCategoryLabel("arabic_translation", "ko"), intakeCategoryLabels.arabic_translation);
assert.equal(getLocalizedIntakeFieldLabel(arabicWorkType, "en"), "Service type");
assert.equal(
  getLocalizedIntakeOptionLabel({
    category: "arabic_translation",
    field: arabicInterpretationMethod,
    option: arabicInterpretationMethod.options?.[3] ?? "",
    locale: "en"
  }),
  "Accompaniment"
);

const koreanIntakeSnapshot = getIntakeFormDisplaySnapshot("ko");
assert.deepEqual(
  koreanIntakeSnapshot.categoryLabels,
  intakeCategoryValues.map((category) => intakeCategoryLabels[category])
);
assert.notDeepEqual(koreanIntakeSnapshot.categoryLabels, englishIntakeSnapshot.categoryLabels);
assert.notEqual(koreanIntakeSnapshot.completion.trackingNumber, englishIntakeSnapshot.completion.trackingNumber);

for (const koreanOnlyValue of Object.values(intakeCategoryLabels)) {
  assert.equal(JSON.stringify(englishIntakeSnapshot).includes(koreanOnlyValue), false);
}

const middlewareSource = readFileSync(join(root, "middleware.ts"), "utf8");
assert.match(middlewareSource, /pathname\.startsWith\("\/admin"\)/);
assert.match(middlewareSource, /pathname\.startsWith\("\/api\/admin"\)/);
assert.match(middlewareSource, /"\/intake\/:path\*"/);
assert.match(middlewareSource, /"\/api\/inquiries"/);
assert.equal(middlewareSource.includes("ADMIN_INGEST_PATH"), false);
assert.equal(middlewareSource.includes("pathname !=="), false);
assert.match(middlewareSource, /"\/track\/:path\*"/);
assert.match(middlewareSource, /"\/api\/public\/track"/);

const intakeFormSource = readFileSync(
  join(root, "src/components/intake/intake-form-safe-v3.tsx"),
  "utf8"
);
const intakeCategorySource = readFileSync(join(root, "src/types/intake-category.ts"), "utf8");
const localizedIntakeSource = `${intakeFormSource}\n${intakeCategorySource}`;

for (const stableKey of [
  "visa",
  "corporation",
  "administrative_appeal",
  "fact_finding_contract",
  "permit_license",
  "arabic_translation",
  "civil_petition",
  "categoryDetails",
  "civilPetitionType"
]) {
  assert.match(localizedIntakeSource, new RegExp(stableKey));
}

for (const englishText of [
  "Select service type",
  "Contact and consultation details",
  "Service-specific questions",
  "Case summary and documents",
  "Consent and submission",
  "Arabic translation and interpretation",
  "Other civil petitions",
  "Tracking number"
]) {
  assert.match(localizedIntakeSource, new RegExp(englishText));
}

assert.equal(intakeFormSource.includes("run-lawbot-workflow"), false);
assert.equal(intakeFormSource.includes("client-message-service"), false);
assert.match(intakeFormSource, /trackingCode/);
assert.match(intakeFormSource, /intakeTracking/);

const routeSource = readFileSync(join(root, "src/app/api/inquiries/route-safe-v3.ts"), "utf8");
assert.equal(routeSource.includes("id: inquiry.id"), false);
assert.equal(routeSource.includes("workflowStatus"), false);
assert.equal(routeSource.includes("updatedBy:"), false);
assert.equal(routeSource.includes("controlSource:"), false);
assert.equal(routeSource.includes("intakeTracking"), false);

const adminDetailSource = readFileSync(
  join(root, "src/components/admin/inquiry-detail-content-sections.tsx"),
  "utf8"
);
const adminPageSource = readFileSync(join(root, "src/app/admin/inquiries/[id]/page.tsx"), "utf8");
assert.match(adminDetailSource, /trackingCode|publicTrackingCode|customerTrackingCode/i);
assert.match(adminDetailSource, /접수 유입 정보/);
assert.match(adminPageSource, /getPublicTrackingCodeFromInquiry/);
assert.match(adminPageSource, /buildIntakeSourceTrackingViewModel/);

const createInquirySource = readFileSync(join(root, "src/lib/services/inquiry-service-create-helpers.ts"), "utf8");
assert.match(createInquirySource, /publicTrackingCode/);
assert.match(createInquirySource, /publicTrackingPhoneLast4/);
assert.match(createInquirySource, /publicTrackingIssuedAt/);
assert.match(createInquirySource, /isPublicTrackingCodeCollision/);
const createDataSource = readFileSync(join(root, "src/lib/services/inquiry-create-data-helpers.ts"), "utf8");
assert.match(createDataSource, /input\.intakeTracking/);

assert.equal(existsSync(join(root, "src/app/track/page.tsx")), true);

console.log("inquiry category flow tests passed");
