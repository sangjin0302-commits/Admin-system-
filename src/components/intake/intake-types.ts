import type { UrgencyLevel } from "@/types/inquiry";
import type {
  IntakeCategory,
  IntakeCategoryDetailField,
  IntakeCategoryDisplayLocale
} from "@/types/intake-category";

export type FormState = {
  category: IntakeCategory | "";
  contactName: string;
  phone: string;
  email: string;
  consultationMethod: string;
  preferredLanguage: string;
  declaredUrgency: UrgencyLevel;
  description: string;
  documentAvailability: string;
  consentToPrivacy: boolean;
  categoryDetails: Record<string, string>;
  website: string;
};

export type FieldGroupKey = "basic" | "deadline" | "documents" | "request";

export type IntakeResponse = {
  deduplicated?: boolean;
  inquiry?: {
    received: boolean;
    message: string;
    trackingCode?: string;
  };
};

export type IntakeAvailabilityResponse = {
  ok?: boolean;
  available?: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
  retryAfterSec?: number | null;
};

export type IntakeFormCopy = {
  required: string;
  optional: string;
  coreHint: string;
  selectPlaceholder: string;
  selectedCategory: string;
  selectedFallback: string;
  step1Title: string;
  step1Description: string;
  step2Title: string;
  step2Description: string;
  step3Title: string;
  step3Description: string;
  step4Title: string;
  step4Description: string;
  step5Title: string;
  step5Description: string;
  extraQuestionsSuffix: string;
  extraQuestionsDescription: string;
  name: string;
  phone: string;
  email: string;
  consultationMethod: string;
  preferredLanguage: string;
  urgency: string;
  description: string;
  documentAvailability: string;
  summaryTitle: string;
  serviceCategory: string;
  petitionSubtype: string;
  documents: string;
  privacyConsent: string;
  submit: string;
  submitting: string;
  completeKicker: string;
  completeMessage: string;
  trackingNumber: string;
  trackingHelp: string;
  categoryRequired: string;
  civilPetitionTypeRequired: string;
  maintenance: string;
  submitError: string;
  timeout: string;
  deduplicated: string;
  fieldGroups: {
    basic: string;
    deadline: string;
    documents: string;
    request: string;
  };
  categoryFallback: Record<IntakeCategory, string>;
};

export type CategoryFieldGroup = {
  groupKey: FieldGroupKey;
  fields: IntakeCategoryDetailField[];
};

export type CommonOptionKind = "consultationMethod" | "preferredLanguage" | "documentAvailability";

export type GetCommonOptionLabel = (input: {
  kind: CommonOptionKind;
  value: string;
  locale: IntakeCategoryDisplayLocale;
}) => string;

export type GetUrgencyDisplayLabel = (
  value: UrgencyLevel,
  locale: IntakeCategoryDisplayLocale
) => string;

export type GetCommonSubtypeDisplay = (
  value: string,
  locale: IntakeCategoryDisplayLocale
) => string;
