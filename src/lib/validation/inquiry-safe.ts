import { z } from "zod";

import {
  clientTypeValues,
  formLocaleValues,
  inquiryTypeValues,
  toLanguageCode,
  urgencyValues
} from "@/types/inquiry";
import {
  getIntakeCategoryDetailLabel,
  intakeCategoryInquiryTypeMap,
  intakeCategoryLabels,
  intakeCategoryValues,
  type IntakeCategory
} from "@/types/intake-category";

const booleanish = z.union([z.boolean(), z.string()]);
const unicodeEscapePattern = /\\u([0-9A-Fa-f]{4})/g;

const validationMessages = {
  contactNameMin: "\uC774\uB984\uC740 2\uC790 \uC774\uC0C1 \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  contactNameMax: "\uC774\uB984\uC740 60\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  organizationNameMax: "\uD68C\uC0AC\uBA85\uC740 100\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  email: "\uC62C\uBC14\uB978 \uC774\uBA54\uC77C \uC8FC\uC18C\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  phoneMax: "\uC804\uD654\uBC88\uD638\uB294 30\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  titleMin: "\uBB38\uC758 \uC81C\uBAA9\uC740 4\uC790 \uC774\uC0C1 \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  titleMax: "\uBB38\uC758 \uC81C\uBAA9\uC740 120\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  descriptionMin: "\uC0C1\uC138 \uB0B4\uC6A9\uC740 20\uC790 \uC774\uC0C1 \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  descriptionMax: "\uC0C1\uC138 \uB0B4\uC6A9\uC740 2000\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  requestedOutcomeMax: "\uC6D0\uD558\uB294 \uACB0\uACFC\uB294 400\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  nationalityMax: "\uAD6D\uC801\uC740 80\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  currentStatusMax: "\uD604\uC7AC \uC0C1\uD0DC\uB294 120\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  documentCountryMax: "\uBB38\uC11C \uBC1C\uD589 \uAD6D\uAC00\uB294 80\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  targetAgencyMax: "\uC81C\uCD9C\uCC98 \uB610\uB294 \uC0AC\uC6A9\uCC98\uB294 120\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  categoryRequired: "\uC5C5\uBB34 \uBD84\uC57C\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.",
  categoryDetailMax: "\uBD84\uC57C\uBCC4 \uC138\uBD80 \uB0B4\uC6A9\uC740 \uD56D\uBAA9\uB2F9 500\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
  consentRequired:
    "\uAC1C\uC778\uC815\uBCF4 \uC218\uC9D1 \uBC0F \uC0C1\uB2F4 \uBAA9\uC801 \uC774\uC6A9 \uB3D9\uC758\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4."
} as const;

function parseBooleanish(value: string | boolean) {
  if (typeof value === "boolean") return value;
  return value === "true" || value === "on";
}

function decodeUnicodeEscapes(value: string) {
  if (!value.includes("\\u")) {
    return value;
  }

  return value.replace(unicodeEscapePattern, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function normalizeTextValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  return decodeUnicodeEscapes(value)
    .replace(/\u0000/g, "")
    .replace(/\uFFFD/g, "")
    .replace(/\r\n?/g, "\n")
    .normalize("NFC")
    .trim();
}

function textSchema(base: z.ZodString) {
  return z.preprocess(normalizeTextValue, base);
}

const categoryDetailsSchema = z
  .record(textSchema(z.string().max(500, validationMessages.categoryDetailMax)))
  .optional()
  .default({});

export const createInquirySchema = z.object({
  preferredLocale: z.enum(formLocaleValues),
  clientType: z.enum(clientTypeValues),
  contactName: textSchema(z.string().min(2, validationMessages.contactNameMin).max(60, validationMessages.contactNameMax)),
  organizationName: textSchema(z.string().max(100, validationMessages.organizationNameMax)).optional().or(z.literal("")),
  email: textSchema(z.string().email(validationMessages.email)),
  phone: textSchema(z.string().max(30, validationMessages.phoneMax)).optional().or(z.literal("")),
  title: textSchema(z.string().min(4, validationMessages.titleMin).max(120, validationMessages.titleMax)),
  description: textSchema(z.string().min(20, validationMessages.descriptionMin).max(2000, validationMessages.descriptionMax)),
  requestedOutcome: textSchema(z.string().max(400, validationMessages.requestedOutcomeMax)).optional().or(z.literal("")),
  requestedInquiryType: z.enum(inquiryTypeValues).optional().default("UNKNOWN"),
  declaredUrgency: z.enum(urgencyValues).optional().default("MEDIUM"),
  nationality: textSchema(z.string().max(80, validationMessages.nationalityMax)).optional().or(z.literal("")),
  currentStatus: textSchema(z.string().max(120, validationMessages.currentStatusMax)).optional().or(z.literal("")),
  documentCountry: textSchema(z.string().max(80, validationMessages.documentCountryMax)).optional().or(z.literal("")),
  targetAgency: textSchema(z.string().max(120, validationMessages.targetAgencyMax)).optional().or(z.literal("")),
  dueDate: textSchema(z.string()).optional().or(z.literal("")),
  category: z.enum(intakeCategoryValues, {
    required_error: validationMessages.categoryRequired,
    invalid_type_error: validationMessages.categoryRequired
  }),
  categoryDetails: categoryDetailsSchema,
  website: textSchema(z.string().max(200)).optional().or(z.literal("")),
  hasPreparedDocuments: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  needsTranslation: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  isCorporateRequest: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  wantsCallback: booleanish.optional().transform((value) => parseBooleanish(value ?? false)),
  consentToPrivacy: booleanish.transform((value) => parseBooleanish(value)).refine(Boolean, {
    message: validationMessages.consentRequired
  })
});

function hasOwnStringValue(details: Record<string, string>, key: string) {
  const value = details[key]?.trim();
  return value ? value : undefined;
}

function formatCategoryDetails(category: IntakeCategory, details: Record<string, string>) {
  const categoryLabel = intakeCategoryLabels[category];
  const rows = Object.entries(details)
    .map(([key, value]) => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      return `- ${getIntakeCategoryDetailLabel(category, key)}: ${trimmed}`;
    })
    .filter(Boolean);

  if (rows.length === 0) {
    return `\n\n[업무 분야]\n${categoryLabel}`;
  }

  return `\n\n[업무 분야]\n${categoryLabel}\n\n[분야별 세부사항]\n${rows.join("\n")}`;
}

export function parseCreateInquiryInput(payload: unknown) {
  const parsed = createInquirySchema.parse(payload);
  const parsedDueDate = parsed.dueDate ? new Date(parsed.dueDate) : undefined;
  const category = parsed.category;
  const categoryDetails = parsed.categoryDetails;
  const effectiveInquiryType =
    parsed.requestedInquiryType && parsed.requestedInquiryType !== "UNKNOWN"
      ? parsed.requestedInquiryType
      : intakeCategoryInquiryTypeMap[category];

  return {
    ...parsed,
    email: parsed.email.trim().toLowerCase(),
    organizationName: parsed.organizationName?.trim() || undefined,
    phone: parsed.phone?.trim() || undefined,
    nationality:
      parsed.nationality?.trim() ||
      hasOwnStringValue(categoryDetails, "nationality") ||
      hasOwnStringValue(categoryDetails, "representativeNationality"),
    currentStatus:
      parsed.currentStatus?.trim() ||
      hasOwnStringValue(categoryDetails, "currentVisaStatus") ||
      hasOwnStringValue(categoryDetails, "currentStage"),
    requestedOutcome: parsed.requestedOutcome?.trim() || undefined,
    requestedInquiryType: effectiveInquiryType,
    declaredUrgency: parsed.declaredUrgency,
    documentCountry: parsed.documentCountry?.trim() || undefined,
    targetAgency:
      parsed.targetAgency?.trim() ||
      hasOwnStringValue(categoryDetails, "agency") ||
      hasOwnStringValue(categoryDetails, "targetAgency") ||
      hasOwnStringValue(categoryDetails, "submissionAgency"),
    dueDate:
      parsedDueDate && !Number.isNaN(parsedDueDate.getTime())
        ? parsedDueDate
        : undefined,
    description: `${parsed.description}${formatCategoryDetails(category, categoryDetails)}`,
    preferredLanguage: toLanguageCode(parsed.preferredLocale)
  };
}
