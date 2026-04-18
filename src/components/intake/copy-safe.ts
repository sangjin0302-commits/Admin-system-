import type { Locale } from "@/types/inquiry";

const ko = {
  labels: {
    preferredLocale: "\uD76C\uB9DD \uC751\uB2F5 \uC5B8\uC5B4",
    clientType: "\uC758\uB8B0 \uD615\uD0DC",
    contactName: "\uC774\uB984",
    organizationName: "\uD68C\uC0AC\uBA85",
    email: "\uC774\uBA54\uC77C",
    phone: "\uC804\uD654\uBC88\uD638",
    title: "\uBB38\uC758 \uC81C\uBAA9",
    requestedInquiryType: "\uBB38\uC758 \uC720\uD615(\uC120\uD0DD)",
    description: "\uC0C1\uC138 \uB0B4\uC6A9",
    requestedOutcome: "\uC6D0\uD558\uB294 \uACB0\uACFC",
    declaredUrgency: "\uCCB4\uAC10 \uAE34\uAE09\uB3C4",
    nationality: "\uAD6D\uC801",
    currentStatus: "\uD604\uC7AC \uCCB4\uB958 \uB610\uB294 \uC9C4\uD589 \uC0C1\uD0DC",
    documentCountry: "\uBB38\uC11C \uBC1C\uD589 \uAD6D\uAC00",
    targetAgency: "\uC81C\uCD9C\uCC98 \uB610\uB294 \uC0AC\uC6A9\uCC98",
    dueDate: "\uD76C\uB9DD \uC77C\uC815 \uB610\uB294 \uB9C8\uAC10\uC77C",
    isCorporateRequest: "\uAE30\uC5C5 \uC758\uB8B0 \uC5EC\uBD80",
    needsTranslation: "\uBC88\uC5ED \uD544\uC694 \uC5EC\uBD80",
    hasPreparedDocuments: "\uBCF4\uC720 \uC790\uB8CC \uC5EC\uBD80",
    wantsCallback: "\uC804\uD654 \uC0C1\uB2F4 \uC694\uCCAD",
    consentToPrivacy:
      "\uAC1C\uC778\uC815\uBCF4 \uC218\uC9D1 \uBC0F \uC0C1\uB2F4 \uBAA9\uC801 \uC774\uC6A9\uC5D0 \uB3D9\uC758\uD569\uB2C8\uB2E4."
  },
  placeholders: {
    contactName: "\uC608: \uAE40\uBBFC\uC9C0",
    organizationName: "\uC608: ABC Global Co.",
    email: "example@email.com",
    phone: "010-0000-0000",
    title: "\uC608: E-7 \uCCB4\uB958\uC790\uACA9 \uBCC0\uACBD \uAC00\uB2A5 \uC5EC\uBD80 \uBB38\uC758",
    description:
      "\uD604\uC7AC \uC0C1\uD669, \uC6D0\uD558\uB294 \uACB0\uACFC, \uB9C8\uAC10\uC77C, \uBCF4\uC720 \uC790\uB8CC, \uC81C\uCD9C\uCC98\uB97C \uAC00\uB2A5\uD55C \uD55C \uAD6C\uCCB4\uC801\uC73C\uB85C \uC801\uC5B4 \uC8FC\uC138\uC694.",
    requestedOutcome: "\uC608: 2\uC8FC \uB0B4 \uCCB4\uB958\uC790\uACA9 \uBCC0\uACBD \uC811\uC218 \uC644\uB8CC",
    nationality: "\uC608: \uBBF8\uAD6D, \uC778\uB3C4, \uC6B0\uC988\uBCA0\uD0A4\uC2A4\uD0C4",
    currentStatus: "\uC608: D-10 \uCCB4\uB958 \uC911 / \uC6D0\uBCF8 \uC11C\uB958 \uBCF4\uC720 / \uBC88\uC5ED \uD544\uC694",
    documentCountry: "\uC608: \uBBF8\uAD6D, UAE",
    targetAgency: "\uC608: \uCD9C\uC785\uAD6D\uC0AC\uBB34\uC18C, \uD559\uAD50, \uC740\uD589"
  },
  buttons: {
    submit: "\uC811\uC218\uD558\uAE30",
    submitting: "\uC811\uC218 \uC911...",
    resetResult: "\uACB0\uACFC \uB2EB\uAE30"
  },
  clientTypeOptions: {
    INDIVIDUAL: "\uAC1C\uC778",
    COMPANY: "\uAE30\uC5C5"
  },
  callbackHelp:
    "\uC0AC\uC548\uC774 \uAE34\uAE09\uD558\uAC70\uB098 \uC124\uBA85\uC774 \uBCF5\uC7A1\uD55C \uACBD\uC6B0\uC5D0\uB294 \uAC80\uD1A0 \uD6C4 \uC6B0\uC120 \uC5F0\uB77D \uB300\uC0C1\uC73C\uB85C \uD45C\uC2DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  optionLabels: {
    corporateYes: "\uAE30\uC5C5 \uC758\uB8B0\uC785\uB2C8\uB2E4.",
    translationYes: "\uBC88\uC5ED\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    documentsReady: "\uAE30\uBCF8 \uC790\uB8CC\uB97C \uC774\uBBF8 \uBCF4\uC720\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4."
  },
  errorGeneric:
    "\uBB38\uC758 \uC811\uC218 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
} as const;

const en = {
  labels: {
    preferredLocale: "Preferred response language",
    clientType: "Client type",
    contactName: "Name",
    organizationName: "Company",
    email: "Email",
    phone: "Phone",
    title: "Subject",
    requestedInquiryType: "Inquiry type (optional)",
    description: "Details",
    requestedOutcome: "Desired outcome",
    declaredUrgency: "Declared urgency",
    nationality: "Nationality",
    currentStatus: "Current visa or progress status",
    documentCountry: "Document issuing country",
    targetAgency: "Target authority or destination",
    dueDate: "Preferred date or deadline",
    isCorporateRequest: "Corporate request",
    needsTranslation: "Translation required",
    hasPreparedDocuments: "Documents currently available",
    wantsCallback: "Request phone consultation",
    consentToPrivacy: "I agree to the collection and use of personal information for consultation."
  },
  placeholders: {
    contactName: "Example: Jane Smith",
    organizationName: "Example: ABC Global Co.",
    email: "example@email.com",
    phone: "+82-10-0000-0000",
    title: "Example: Eligibility for E-7 visa change",
    description:
      "Please describe your situation, desired outcome, deadline, available documents, and target authority.",
    requestedOutcome: "Example: File visa change within 2 weeks",
    nationality: "Example: United States, India, Uzbekistan",
    currentStatus: "Example: On D-10 / original documents available / translation needed",
    documentCountry: "Example: United States, UAE",
    targetAgency: "Example: Immigration office, bank, school"
  },
  buttons: {
    submit: "Submit Inquiry",
    submitting: "Submitting...",
    resetResult: "Close Result"
  },
  clientTypeOptions: {
    INDIVIDUAL: "Individual",
    COMPANY: "Company"
  },
  callbackHelp: "Urgent or complex matters can be flagged for priority follow-up after review.",
  optionLabels: {
    corporateYes: "This is a corporate request.",
    translationYes: "Translation is required.",
    documentsReady: "I already have base documents."
  },
  errorGeneric: "There was an error while submitting. Please review the form and try again."
} as const;

export function getIntakeCopy(locale: Locale) {
  return locale === "en" ? en : ko;
}
