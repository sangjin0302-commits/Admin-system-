"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StateInline } from "@/components/ui/state-panel";
import { Textarea } from "@/components/ui/textarea";
import { parseClientApiError } from "@/lib/http/client-api";
import type { Locale, UrgencyLevel } from "@/types/inquiry";
import {
  civilPetitionSubtypeValues,
  consultationMethodOptions,
  documentAvailabilityOptions,
  getCivilPetitionSubtypeFieldKeys,
  getCivilPetitionSubtypeFields,
  getLocalizedIntakeCategoryGuidance,
  getLocalizedIntakeCategoryHelp,
  getLocalizedIntakeCategoryLabel,
  getLocalizedIntakeFieldLabel,
  getLocalizedIntakeOptionLabel,
  intakeCategoryClientTypeMap,
  intakeCategoryDetailFields,
  intakeCategoryInquiryTypeMap,
  intakeCategoryLabels,
  intakeCategoryValues,
  preferredLanguageOptions,
  urgencyOptionLabels,
  type IntakeCategory,
  type IntakeCategoryDetailField,
  type IntakeCategoryDisplayLocale
} from "@/types/intake-category";

type IntakeResponse = {
  deduplicated?: boolean;
  inquiry?: {
    received: boolean;
    message: string;
    trackingCode?: string;
  };
};

type IntakeAvailabilityResponse = {
  ok?: boolean;
  available?: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
  retryAfterSec?: number | null;
};

type FormState = {
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

type FieldGroupKey = "basic" | "deadline" | "documents" | "request";

const initialState: FormState = {
  category: "",
  contactName: "",
  phone: "",
  email: "",
  consultationMethod: consultationMethodOptions[0],
  preferredLanguage: preferredLanguageOptions[0],
  declaredUrgency: "MEDIUM",
  description: "",
  documentAvailability: documentAvailabilityOptions[0],
  consentToPrivacy: false,
  categoryDetails: {},
  website: ""
};

const INTAKE_SUBMIT_TIMEOUT_MS = 12_000;

const intakeFormCopy = {
  ko: {
    required: "필수",
    optional: "선택",
    coreHint: "핵심 분류 질문입니다.",
    selectPlaceholder: "선택해 주세요",
    selectedCategory: "선택한 분야",
    selectedFallback: "선택 전",
    step1Title: "업무 분야 선택",
    step1Description: "먼저 필요한 업무를 고르면 관련 질문만 이어서 정리합니다.",
    step2Title: "연락처 및 상담 정보",
    step2Description: "담당자가 접수 내용을 확인하고 연락드리기 위한 기본 정보입니다.",
    step3Title: "분야별 상세 질문",
    step3Description: "정확히 모르는 항목은 비워도 됩니다. 핵심 분류 질문만 먼저 확인합니다.",
    step4Title: "사건 개요 및 서류",
    step4Description: "현재 상황과 보유 자료를 알려 주시면 담당자가 확인할 범위를 줄일 수 있습니다.",
    step5Title: "동의 및 제출",
    step5Description: "제출 전 선택한 접수 내용을 한 번만 확인해 주세요.",
    extraQuestionsSuffix: "추가 질문",
    extraQuestionsDescription: "선택한 민원 세부 유형에 맞춰 필요한 추가 정보를 확인합니다.",
    name: "이름",
    phone: "연락처",
    email: "이메일",
    consultationMethod: "희망 상담 방식",
    preferredLanguage: "희망 언어",
    urgency: "긴급도",
    description: "사건/업무 개요",
    documentAvailability: "관련 서류 보유 여부",
    summaryTitle: "제출 전 요약",
    serviceCategory: "업무 분야",
    petitionSubtype: "민원 세부 유형",
    documents: "관련 서류",
    privacyConsent: "개인정보 수집 및 이용에 동의합니다.",
    submit: "접수하기",
    submitting: "접수 중...",
    completeKicker: "접수 완료",
    completeMessage: "접수가 완료되었습니다. 담당자가 확인 후 연락드리겠습니다.",
    trackingNumber: "접수번호",
    trackingHelp: "접수 진행상황은 접수번호로 확인할 수 있습니다.",
    categoryRequired: "업무 분야를 먼저 선택해 주세요.",
    civilPetitionTypeRequired: "기타 민원은 민원 세부 유형을 선택해 주세요.",
    maintenance: "현재 접수 시스템 점검 중으로 접수가 일시 중지되었습니다.",
    submitError: "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    timeout: "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
    deduplicated: "최근 동일 문의가 확인되어 기존 접수 흐름으로 연결했습니다.",
    fieldGroups: {
      basic: "기본 정보",
      deadline: "기한/긴급도",
      documents: "서류/증빙",
      request: "요청사항"
    },
    categoryFallback: {
      visa: "체류 자격, 만료일, 거절 이력처럼 기한과 리스크를 먼저 확인합니다.",
      corporation: "설립/변경 등기와 인허가 필요성을 함께 확인합니다.",
      administrative_appeal: "처분일과 불복 기한을 기준으로 진행 가능성을 확인합니다.",
      fact_finding_contract: "사실관계와 최종 사용 목적을 기준으로 필요한 문서 범위를 정합니다.",
      permit_license: "대상 기관, 진행 단계, 보완 요구 여부를 중심으로 준비 범위를 확인합니다.",
      arabic_translation: "아랍어 번역, 통역, 공증·인증, 기관 제출용 문서 지원 범위를 확인합니다.",
      civil_petition: "자동차 등록, 일반 민원, 고충 민원, 정보공개 등 행정 민원을 분류합니다."
    }
  },
  en: {
    required: "Required",
    optional: "Optional",
    coreHint: "This is a core classification question.",
    selectPlaceholder: "Select an option",
    selectedCategory: "Selected service type",
    selectedFallback: "Not selected",
    step1Title: "Select service type",
    step1Description: "Choose the service area first so we only ask the relevant questions.",
    step2Title: "Contact and consultation details",
    step2Description: "Basic information used by staff to review your request and contact you.",
    step3Title: "Service-specific questions",
    step3Description: "Leave uncertain items blank. Please answer the core classification question first.",
    step4Title: "Case summary and documents",
    step4Description: "Tell us the current situation and available documents so staff can review efficiently.",
    step5Title: "Consent and submission",
    step5Description: "Review your selected intake details once before submitting.",
    extraQuestionsSuffix: "additional questions",
    extraQuestionsDescription: "Additional questions are shown for the selected petition subtype.",
    name: "Name",
    phone: "Phone",
    email: "Email",
    consultationMethod: "Preferred consultation method",
    preferredLanguage: "Preferred language",
    urgency: "Urgency",
    description: "Case or service summary",
    documentAvailability: "Related documents available",
    summaryTitle: "Submission summary",
    serviceCategory: "Service type",
    petitionSubtype: "Petition subtype",
    documents: "Documents",
    privacyConsent: "I agree to the collection and use of personal information.",
    submit: "Submit request",
    submitting: "Submitting...",
    completeKicker: "Submission complete",
    completeMessage: "Your request has been submitted. A staff member will review it and contact you.",
    trackingNumber: "Tracking number",
    trackingHelp: "You can check your request status with your tracking number.",
    categoryRequired: "Please select a service type first.",
    civilPetitionTypeRequired: "Please select a petition subtype for other civil petitions.",
    maintenance: "Intake is temporarily paused for system maintenance.",
    submitError: "An error occurred while submitting your request. Please try again shortly.",
    timeout: "The request timed out. Please try again shortly.",
    deduplicated: "A recent duplicate request was found, so we linked you to the existing intake flow.",
    fieldGroups: {
      basic: "Basic information",
      deadline: "Deadlines and urgency",
      documents: "Documents and evidence",
      request: "Requested outcome"
    },
    categoryFallback: {
      visa: "We first check visa status, expiry dates, prior denials, deadlines, and risk factors.",
      corporation: "We review registration, changes, and permit needs together.",
      administrative_appeal: "We review feasibility based on the disposition date and appeal deadline.",
      fact_finding_contract: "We define the document scope based on facts and final use purpose.",
      permit_license: "We review the target agency, current stage, and supplement requests.",
      arabic_translation: "We review Arabic translation, interpretation, notarization, certification, and agency submission needs.",
      civil_petition: "We classify vehicle registration, general petitions, grievances, and information disclosure requests."
    }
  }
} as const;

const localizedCommonOptions = {
  consultationMethod: {
    en: ["Phone consultation", "Email consultation", "Office visit", "Video consultation"]
  },
  preferredLanguage: {
    en: ["Korean", "English", "Arabic"]
  },
  documentAvailability: {
    en: ["Documents available", "Partially available", "Not yet available", "Need confirmation"]
  },
  urgency: {
    en: {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      CRITICAL: "Critical"
    }
  }
} as const;

export function getIntakeFormDisplaySnapshot(locale: IntakeCategoryDisplayLocale) {
  return {
    sectionHeadings: [
      intakeFormCopy[locale].step1Title,
      intakeFormCopy[locale].step2Title,
      intakeFormCopy[locale].step3Title,
      intakeFormCopy[locale].step4Title,
      intakeFormCopy[locale].step5Title
    ],
    categoryLabels: intakeCategoryValues.map((category) =>
      getLocalizedIntakeCategoryLabel(category, locale)
    ),
    arabicFieldLabels: intakeCategoryDetailFields.arabic_translation.map((field) =>
      getLocalizedIntakeFieldLabel(field, locale)
    ),
    civilPetitionSubtypeLabels: civilPetitionSubtypeValues.map((option) => {
      const field = intakeCategoryDetailFields.civil_petition[0];
      return getLocalizedIntakeOptionLabel({
        category: "civil_petition",
        field,
        option,
        locale
      });
    }),
    completion: {
      message: intakeFormCopy[locale].completeMessage,
      trackingNumber: intakeFormCopy[locale].trackingNumber,
      trackingHelp: intakeFormCopy[locale].trackingHelp
    }
  };
}

function getDisplayLocale(initialLocale: Locale): IntakeCategoryDisplayLocale {
  return initialLocale === "en" ? "en" : "ko";
}

function getPreferredLocale(preferredLanguage: string): "ko" | "en" {
  return preferredLanguage === preferredLanguageOptions[1] ? "en" : "ko";
}

function getBooleanFromAvailability(value: string) {
  return value === documentAvailabilityOptions[0] || value === documentAvailabilityOptions[1];
}

function getIndexedDisplayLabel(
  options: readonly string[],
  value: string,
  englishLabels: readonly string[] | undefined,
  locale: IntakeCategoryDisplayLocale
) {
  if (locale !== "en") return value;
  const index = options.indexOf(value);
  return index >= 0 ? englishLabels?.[index] ?? value : value;
}

function getCommonOptionLabel(input: {
  kind: "consultationMethod" | "preferredLanguage" | "documentAvailability";
  value: string;
  locale: IntakeCategoryDisplayLocale;
}) {
  if (input.kind === "consultationMethod") {
    return getIndexedDisplayLabel(
      consultationMethodOptions,
      input.value,
      localizedCommonOptions.consultationMethod.en,
      input.locale
    );
  }
  if (input.kind === "preferredLanguage") {
    return getIndexedDisplayLabel(
      preferredLanguageOptions,
      input.value,
      localizedCommonOptions.preferredLanguage.en,
      input.locale
    );
  }
  return getIndexedDisplayLabel(
    documentAvailabilityOptions,
    input.value,
    localizedCommonOptions.documentAvailability.en,
    input.locale
  );
}

function getUrgencyDisplayLabel(value: UrgencyLevel, locale: IntakeCategoryDisplayLocale) {
  return locale === "en" ? localizedCommonOptions.urgency.en[value] : urgencyOptionLabels[value];
}

function getCategoryHelp(category: IntakeCategory, locale: IntakeCategoryDisplayLocale) {
  return (
    getLocalizedIntakeCategoryHelp(category, locale) ??
    intakeFormCopy[locale].categoryFallback[category]
  );
}

function getCategoryGuidance(category: IntakeCategory, locale: IntakeCategoryDisplayLocale) {
  return (
    getLocalizedIntakeCategoryGuidance(category, locale) ??
    intakeFormCopy[locale].categoryFallback[category]
  );
}

function StepHeader({
  step,
  title,
  description
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-sm font-semibold text-white">
        {step}
      </span>
      <div>
        <p className="text-base font-semibold text-text-strong">{title}</p>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
    </div>
  );
}

function FieldBadge({
  required,
  locale
}: {
  required?: boolean;
  locale: IntakeCategoryDisplayLocale;
}) {
  const copy = intakeFormCopy[locale];
  return (
    <span className={required ? "ui-status-pill intake-pill-required" : "ui-status-pill intake-pill-optional"}>
      {required ? copy.required : copy.optional}
    </span>
  );
}

function FieldLabel({
  label,
  required,
  locale
}: {
  label: string;
  required?: boolean;
  locale: IntakeCategoryDisplayLocale;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>{label}</span>
      <FieldBadge required={required} locale={locale} />
    </span>
  );
}

function getFieldGroupKey(field: IntakeCategoryDetailField): FieldGroupKey {
  const key = field.key.toLowerCase();

  if (
    key.includes("date") ||
    key.includes("deadline") ||
    key.includes("expiry") ||
    key.includes("urgent") ||
    key.includes("schedule")
  ) {
    return "deadline";
  }

  if (
    key.includes("document") ||
    key.includes("evidence") ||
    key.includes("file") ||
    key.includes("proof") ||
    key.includes("certificate") ||
    key.includes("material")
  ) {
    return "documents";
  }

  if (
    key.includes("desired") ||
    key.includes("purpose") ||
    key.includes("result") ||
    key.includes("target") ||
    key.includes("method") ||
    key.includes("agency")
  ) {
    return "request";
  }

  return "basic";
}

function groupCategoryFields(fields: readonly IntakeCategoryDetailField[]) {
  const groups = ["basic", "deadline", "documents", "request"] as const;
  return groups
    .map((groupKey) => ({
      groupKey,
      fields: fields.filter((field) => getFieldGroupKey(field) === groupKey)
    }))
    .filter((group) => group.fields.length > 0);
}

function isRequiredCategoryField(category: IntakeCategory, field: IntakeCategoryDetailField) {
  if (category === "civil_petition") return field.key === "civilPetitionType";
  return field.key === "workType";
}

function CategoryField({
  field,
  category,
  value,
  onChange,
  required = false,
  locale
}: {
  field: IntakeCategoryDetailField;
  category: IntakeCategory | null;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  locale: IntakeCategoryDisplayLocale;
}) {
  const copy = intakeFormCopy[locale];
  const label = getLocalizedIntakeFieldLabel(field, locale);

  if (field.input === "textarea") {
    return (
      <Field label="" hint={required ? copy.coreHint : undefined}>
        <label className="ui-label">
          <FieldLabel label={label} required={required} locale={locale} />
        </label>
        <Textarea
          required={required}
          rows={4}
          maxLength={700}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
        />
      </Field>
    );
  }

  if (field.input === "select") {
    return (
      <Field label="" hint={required ? copy.coreHint : undefined}>
        <label className="ui-label">
          <FieldLabel label={label} required={required} locale={locale} />
        </label>
        <Select required={required} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">{copy.selectPlaceholder}</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {getLocalizedIntakeOptionLabel({ category, field, option, locale })}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  return (
    <Field label="" hint={required ? copy.coreHint : undefined}>
      <label className="ui-label">
        <FieldLabel label={label} required={required} locale={locale} />
      </label>
      <Input
        required={required}
        type={field.input}
        maxLength={field.input === "date" ? undefined : 160}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
      />
    </Field>
  );
}

export function IntakeFormSafeV3({ initialLocale }: { initialLocale: Locale }) {
  const locale = getDisplayLocale(initialLocale);
  const copy = intakeFormCopy[locale];
  const [form, setForm] = useState<FormState>({
    ...initialState,
    preferredLanguage: initialLocale === "en" ? preferredLanguageOptions[1] : preferredLanguageOptions[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [intakeAvailable, setIntakeAvailable] = useState(true);
  const [intakeMessage, setIntakeMessage] = useState("");
  const [completedMessage, setCompletedMessage] = useState("");
  const [completedTrackingCode, setCompletedTrackingCode] = useState("");

  const selectedCategory = form.category || null;
  const selectedCategoryFields = useMemo(
    () => (selectedCategory ? intakeCategoryDetailFields[selectedCategory] : []),
    [selectedCategory]
  );
  const selectedCivilPetitionSubtype = form.categoryDetails.civilPetitionType;
  const selectedCivilPetitionSubtypeFields = useMemo(
    () =>
      selectedCategory === "civil_petition"
        ? getCivilPetitionSubtypeFields(selectedCivilPetitionSubtype)
        : [],
    [selectedCategory, selectedCivilPetitionSubtype]
  );
  const categoryFieldGroups = useMemo(
    () => groupCategoryFields(selectedCategoryFields),
    [selectedCategoryFields]
  );
  const civilPetitionSubtypeFieldGroups = useMemo(
    () => groupCategoryFields(selectedCivilPetitionSubtypeFields),
    [selectedCivilPetitionSubtypeFields]
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchAvailability() {
      try {
        const response = await fetch("/api/inquiries", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" }
        });
        const payload = (await response.json().catch(() => null)) as IntakeAvailabilityResponse | null;

        if (cancelled || !payload || typeof payload.available !== "boolean") {
          return;
        }

        setIntakeAvailable(payload.available);
        const nextMessage = payload.maintenanceMessage?.trim() ?? "";
        setIntakeMessage(nextMessage);
        if (!payload.available && nextMessage) {
          setError(nextMessage);
        }
      } catch {
        if (!cancelled) {
          setIntakeAvailable(true);
        }
      }
    }

    void fetchAvailability();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateCategory(category: IntakeCategory) {
    setForm((current) => ({
      ...current,
      category,
      categoryDetails: {}
    }));
    setCompletedMessage("");
    setCompletedTrackingCode("");
    setError("");
  }

  function updateCategoryDetail(key: string, value: string) {
    setForm((current) => ({
      ...current,
      categoryDetails: {
        ...Object.fromEntries(
          Object.entries(current.categoryDetails).filter(
            ([detailKey]) =>
              key !== "civilPetitionType" || !getCivilPetitionSubtypeFieldKeys().includes(detailKey)
          )
        ),
        [key]: value
      }
    }));
  }

  function buildPayload() {
    if (!selectedCategory) {
      return null;
    }

    const categoryLabel = intakeCategoryLabels[selectedCategory];
    const preferredLocale = getPreferredLocale(form.preferredLanguage);
    const categoryDetails: Record<string, string> = {
      consultationMethod: form.consultationMethod,
      preferredLanguage: form.preferredLanguage,
      documentAvailability: form.documentAvailability,
      ...form.categoryDetails
    };

    return {
      preferredLocale,
      clientType: intakeCategoryClientTypeMap[selectedCategory],
      contactName: form.contactName,
      organizationName: "",
      email: form.email,
      phone: form.phone,
      title: `${categoryLabel} 상담 요청`,
      description: form.description,
      requestedOutcome: `${categoryLabel} 업무 검토 및 진행 가능성 안내`,
      requestedInquiryType: intakeCategoryInquiryTypeMap[selectedCategory],
      declaredUrgency: form.declaredUrgency,
      nationality: form.categoryDetails.nationality ?? form.categoryDetails.representativeNationality ?? "",
      currentStatus: form.categoryDetails.currentVisaStatus ?? form.categoryDetails.currentStage ?? "",
      documentCountry: "",
      targetAgency:
        form.categoryDetails.agency ??
        form.categoryDetails.targetAgency ??
        form.categoryDetails.generalTargetAgency ??
        form.categoryDetails.disclosureTargetAgency ??
        form.categoryDetails.relatedAgencyDepartment ??
        form.categoryDetails.submissionAgencyOrUsePurpose ??
        form.categoryDetails.submissionAgency ??
        "",
      hasPreparedDocuments: getBooleanFromAvailability(form.documentAvailability),
      needsTranslation: selectedCategory === "arabic_translation",
      isCorporateRequest: intakeCategoryClientTypeMap[selectedCategory] === "COMPANY",
      wantsCallback: form.consultationMethod === consultationMethodOptions[0],
      dueDate:
        form.categoryDetails.desiredDeadline ??
        form.categoryDetails.desiredCompletionDate ??
        form.categoryDetails.processingDeadline ??
        form.categoryDetails.stayExpiryDate ??
        "",
      category: selectedCategory,
      categoryDetails,
      consentToPrivacy: form.consentToPrivacy,
      website: form.website
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intakeAvailable) {
      setError(intakeMessage || copy.maintenance);
      return;
    }

    const payload = buildPayload();
    if (!payload) {
      setError(copy.categoryRequired);
      return;
    }
    if (
      payload.category === "civil_petition" &&
      !(civilPetitionSubtypeValues as readonly string[]).includes(payload.categoryDetails.civilPetitionType ?? "")
    ) {
      setError(copy.civilPetitionTypeRequired);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");
    setCompletedMessage("");
    setCompletedTrackingCode("");
    let timeoutId: number | undefined;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), INTAKE_SUBMIT_TIMEOUT_MS);

      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setError(await parseClientApiError(response, copy.submitError));
        return;
      }

      const data = (await response.json().catch(() => null)) as IntakeResponse | null;
      setCompletedMessage(copy.completeMessage);
      setCompletedTrackingCode(data?.inquiry?.trackingCode ?? "");
      if (data?.deduplicated) {
        setNotice(copy.deduplicated);
      }

      setForm({
        ...initialState,
        preferredLanguage: form.preferredLanguage
      });
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        setError(copy.timeout);
      } else {
        setError(copy.submitError);
      }
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[10000px] top-auto h-0 w-0 overflow-hidden opacity-0"
        >
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => updateField("website", event.target.value)}
          />
        </div>

        <section className="space-y-4">
          <StepHeader
            step={1}
            title={copy.step1Title}
            description={copy.step1Description}
          />
          <div className="grid gap-3">
            {intakeCategoryValues.map((category) => {
              const selected = form.category === category;
              return (
                <button
                  key={category}
                  type="button"
                  className={[
                    "rounded-md border p-4 text-left transition",
                    selected
                      ? "border-primary bg-primary/10 text-text-strong"
                      : "border-line bg-surface text-text hover:border-primary/50"
                  ].join(" ")}
                  onClick={() => updateCategory(category)}
                >
                  <span className="block text-base font-semibold">
                    {getLocalizedIntakeCategoryLabel(category, locale)}
                  </span>
                  <span className="mt-1 block text-sm text-text-muted">
                    {getCategoryHelp(category, locale)}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedCategory ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-text-muted">{copy.selectedCategory}</span>
                <Badge>{getLocalizedIntakeCategoryLabel(selectedCategory, locale)}</Badge>
              </div>
              <p className="mt-2 text-sm text-text-muted">
                {getCategoryGuidance(selectedCategory, locale)}
              </p>
            </div>
          ) : null}
        </section>

        <section className="space-y-4 border-t border-line pt-6">
          <StepHeader
            step={2}
            title={copy.step2Title}
            description={copy.step2Description}
          />
          <FieldGroup>
            <Field label="">
              <label className="ui-label">
                <FieldLabel label={copy.name} required locale={locale} />
              </label>
              <Input
                required
                minLength={2}
                maxLength={60}
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                placeholder={locale === "en" ? "Full name" : "예: 김민수"}
              />
            </Field>

            <Field label="">
              <label className="ui-label">
                <FieldLabel label={copy.phone} required locale={locale} />
              </label>
              <Input
                required
                maxLength={30}
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="010-0000-0000"
              />
            </Field>

            <Field label="">
              <label className="ui-label">
                <FieldLabel label={copy.email} required locale={locale} />
              </label>
              <Input
                required
                type="email"
                maxLength={254}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="example@email.com"
              />
            </Field>

            <Field label="">
              <label className="ui-label">
                <FieldLabel label={copy.consultationMethod} locale={locale} />
              </label>
              <Select
                value={form.consultationMethod}
                onChange={(event) => updateField("consultationMethod", event.target.value)}
              >
                {consultationMethodOptions.map((option) => (
                  <option key={option} value={option}>
                    {getCommonOptionLabel({ kind: "consultationMethod", value: option, locale })}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="">
              <label className="ui-label">
                <FieldLabel label={copy.preferredLanguage} locale={locale} />
              </label>
              <Select
                value={form.preferredLanguage}
                onChange={(event) => updateField("preferredLanguage", event.target.value)}
              >
                {preferredLanguageOptions.map((option) => (
                  <option key={option} value={option}>
                    {getCommonOptionLabel({ kind: "preferredLanguage", value: option, locale })}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="">
              <label className="ui-label">
                <FieldLabel label={copy.urgency} locale={locale} />
              </label>
              <Select
                value={form.declaredUrgency}
                onChange={(event) => updateField("declaredUrgency", event.target.value as UrgencyLevel)}
              >
                {Object.keys(urgencyOptionLabels).map((value) => (
                  <option key={value} value={value}>
                    {getUrgencyDisplayLabel(value as UrgencyLevel, locale)}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldGroup>
        </section>

        {selectedCategory ? (
          <section className="space-y-4 border-t border-line pt-6">
            <StepHeader
              step={3}
              title={copy.step3Title}
              description={copy.step3Description}
            />
            <div className="rounded-md border border-line bg-surface-muted p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{getLocalizedIntakeCategoryLabel(selectedCategory, locale)}</Badge>
                <span className="text-sm text-text-muted">
                  {getCategoryGuidance(selectedCategory, locale)}
                </span>
              </div>
            </div>
            <div className="space-y-5">
              {categoryFieldGroups.map((group) => (
                <div key={group.groupKey} className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-strong">
                    {copy.fieldGroups[group.groupKey]}
                  </h4>
                  <FieldGroup>
                    {group.fields.map((field) => (
                      <CategoryField
                        key={field.key}
                        category={selectedCategory}
                        field={field}
                        required={isRequiredCategoryField(selectedCategory, field)}
                        value={form.categoryDetails[field.key] ?? ""}
                        onChange={(value) => updateCategoryDetail(field.key, value)}
                        locale={locale}
                      />
                    ))}
                  </FieldGroup>
                </div>
              ))}
            </div>
            {selectedCategory === "civil_petition" && selectedCivilPetitionSubtype ? (
              <div className="space-y-4 border-t border-line pt-5">
                <div>
                  <p className="ui-kicker">
                    {getCommonSubtypeDisplay(selectedCivilPetitionSubtype, locale)} {copy.extraQuestionsSuffix}
                  </p>
                  <p className="mt-2 text-sm text-text-muted">
                    {copy.extraQuestionsDescription}
                  </p>
                </div>
                <div className="space-y-5">
                  {civilPetitionSubtypeFieldGroups.map((group) => (
                    <div key={group.groupKey} className="space-y-3">
                      <h4 className="text-sm font-semibold text-text-strong">
                        {copy.fieldGroups[group.groupKey]}
                      </h4>
                      <FieldGroup>
                        {group.fields.map((field) => (
                          <CategoryField
                            key={field.key}
                            category={selectedCategory}
                            field={field}
                            value={form.categoryDetails[field.key] ?? ""}
                            onChange={(value) => updateCategoryDetail(field.key, value)}
                            locale={locale}
                          />
                        ))}
                      </FieldGroup>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-4 border-t border-line pt-6">
          <StepHeader
            step={4}
            title={copy.step4Title}
            description={copy.step4Description}
          />
          <FieldGroup>
            <Field label="" hint={locale === "en" ? "Summarize current status, desired outcome, deadline, and documents." : "현재 상황, 원하는 결과, 기한, 보유 자료를 중심으로 적어 주세요."}>
              <label className="ui-label">
                <FieldLabel label={copy.description} required locale={locale} />
              </label>
              <Textarea
                required
                rows={7}
                minLength={20}
                maxLength={2000}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder={
                  locale === "en"
                    ? "Please describe the current situation, needed service, deadline, and available documents."
                    : "예: 현재 상황, 필요한 업무, 마감일, 보유 자료를 알려 주세요."
                }
              />
            </Field>

            <Field label="">
              <label className="ui-label">
                <FieldLabel label={copy.documentAvailability} locale={locale} />
              </label>
              <Select
                value={form.documentAvailability}
                onChange={(event) => updateField("documentAvailability", event.target.value)}
              >
                {documentAvailabilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {getCommonOptionLabel({ kind: "documentAvailability", value: option, locale })}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldGroup>
        </section>

        <section className="space-y-4 border-t border-line pt-6">
          <StepHeader
            step={5}
            title={copy.step5Title}
            description={copy.step5Description}
          />
          <div className="rounded-md border border-line bg-surface-muted p-4">
            <p className="text-sm font-semibold text-text-strong">{copy.summaryTitle}</p>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-text-muted">{copy.serviceCategory}</dt>
                <dd className="font-medium text-text-strong">
                  {selectedCategory ? getLocalizedIntakeCategoryLabel(selectedCategory, locale) : copy.selectedFallback}
                </dd>
              </div>
              {selectedCategory === "civil_petition" && selectedCivilPetitionSubtype ? (
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <dt className="text-text-muted">{copy.petitionSubtype}</dt>
                  <dd className="font-medium text-text-strong">
                    {getCommonSubtypeDisplay(selectedCivilPetitionSubtype, locale)}
                  </dd>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-text-muted">{copy.consultationMethod}</dt>
                <dd className="font-medium text-text-strong">
                  {getCommonOptionLabel({ kind: "consultationMethod", value: form.consultationMethod, locale })}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-text-muted">{copy.preferredLanguage}</dt>
                <dd className="font-medium text-text-strong">
                  {getCommonOptionLabel({ kind: "preferredLanguage", value: form.preferredLanguage, locale })}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-text-muted">{copy.urgency}</dt>
                <dd className="font-medium text-text-strong">
                  {getUrgencyDisplayLabel(form.declaredUrgency, locale)}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-text-muted">{copy.documents}</dt>
                <dd className="font-medium text-text-strong">
                  {getCommonOptionLabel({ kind: "documentAvailability", value: form.documentAvailability, locale })}
                </dd>
              </div>
            </dl>
          </div>
          <label className="flex items-start gap-3 rounded-md border border-line bg-surface-muted p-4">
            <input
              required
              type="checkbox"
              checked={form.consentToPrivacy}
              onChange={(event) => updateField("consentToPrivacy", event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-line text-primary"
            />
            <span className="text-sm font-semibold text-text-strong">
              {copy.privacyConsent}
            </span>
          </label>

          {error ? <StateInline tone="error">{error}</StateInline> : null}
          {!error && notice ? <StateInline tone="success">{notice}</StateInline> : null}

          <Button type="submit" disabled={isSubmitting || !intakeAvailable} size="lg" fullWidth>
            {isSubmitting ? copy.submitting : copy.submit}
          </Button>
        </section>
      </form>

      {completedMessage ? (
        <section className="rounded-md border border-line bg-surface-muted p-5">
          <p className="ui-kicker">{copy.completeKicker}</p>
          <p className="mt-2 text-base font-semibold text-text-strong">{completedMessage}</p>
          {completedTrackingCode ? (
            <>
              <p className="mt-3 text-sm text-text">
                {copy.trackingNumber}:{" "}
                <span className="font-semibold text-text-strong">{completedTrackingCode}</span>
              </p>
              <p className="mt-2 text-sm text-text-muted">{copy.trackingHelp}</p>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function getCommonSubtypeDisplay(value: string, locale: IntakeCategoryDisplayLocale) {
  const field = intakeCategoryDetailFields.civil_petition[0];
  return getLocalizedIntakeOptionLabel({
    category: "civil_petition",
    field,
    option: value,
    locale
  });
}
