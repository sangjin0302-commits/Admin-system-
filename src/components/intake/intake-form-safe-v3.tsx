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
  intakeCategoryClientTypeMap,
  intakeCategoryDetailFields,
  intakeCategoryInquiryTypeMap,
  intakeCategoryLabels,
  intakeCategoryValues,
  preferredLanguageOptions,
  urgencyOptionLabels,
  type IntakeCategory,
  type IntakeCategoryDetailField
} from "@/types/intake-category";

type IntakeResponse = {
  deduplicated?: boolean;
  inquiry?: {
    received: boolean;
    message: string;
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
const COMPLETE_MESSAGE = "접수가 완료되었습니다. 담당자가 확인 후 연락드리겠습니다.";

function getPreferredLocale(preferredLanguage: string): "ko" | "en" {
  return preferredLanguage === "영어" ? "en" : "ko";
}

function getBooleanFromAvailability(value: string) {
  return value === "관련 서류 보유" || value === "일부 보유";
}

function getCategoryHelp(category: IntakeCategory) {
  const help: Record<IntakeCategory, string> = {
    visa: "체류 자격, 만료일, 거절 이력처럼 기한과 리스크를 먼저 확인합니다.",
    corporation: "설립/변경/등기와 인허가 필요성을 함께 확인합니다.",
    administrative_appeal: "처분일과 불복 기한을 기준으로 진행 가능성을 확인합니다.",
    fact_finding_contract: "사실관계와 최종 사용 목적을 기준으로 필요한 문서 범위를 정합니다.",
    permit_license: "대상 기관, 진행 단계, 보완 요구 여부를 중심으로 준비 범위를 확인합니다.",
    arabic_translation: "아랍어 번역, 통역, 공증·인증, 기관 제출용 문서 지원 범위를 확인합니다.",
    civil_petition: "자동차 등록, 일반 민원, 고충 민원, 정보 공개 등 생활 행정민원을 분류합니다."
  };
  return help[category];
}

function getCategoryGuidance(category: IntakeCategory) {
  const guidance: Record<IntakeCategory, string> = {
    visa: "체류자격, 초청, 연장, 변경, 불허 대응 정보를 확인합니다.",
    corporation: "법인 설립, 변경, 외국인투자, 지점·연락사무소, 청산 관련 정보를 확인합니다.",
    administrative_appeal: "처분 내용, 불복 기한, 원하는 결과, 집행정지 필요성을 확인합니다.",
    fact_finding_contract: "사실관계, 분쟁 여부, 필요한 문서와 제출·발송 대상을 확인합니다.",
    permit_license: "인허가 종류, 대상 기관, 진행 단계, 보완 요구와 업종 정보를 확인합니다.",
    arabic_translation: "번역, 통역, 공증·인증, 기관 제출 목적을 확인합니다.",
    civil_petition: "자동차 등록, 정보공개, 고충민원 등 일반 행정 민원을 확인합니다."
  };
  return guidance[category];
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

function FieldBadge({ required }: { required?: boolean }) {
  return (
    <span className={required ? "ui-status-pill intake-pill-required" : "ui-status-pill intake-pill-optional"}>
      {required ? "필수" : "선택"}
    </span>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>{label}</span>
      <FieldBadge required={required} />
    </span>
  );
}

function getFieldGroupTitle(field: IntakeCategoryDetailField) {
  const key = field.key.toLowerCase();
  const label = field.label;

  if (
    key.includes("date") ||
    key.includes("deadline") ||
    key.includes("expiry") ||
    key.includes("urgent") ||
    label.includes("기한") ||
    label.includes("긴급") ||
    label.includes("납기") ||
    label.includes("일정")
  ) {
    return "기한/긴급도";
  }

  if (
    key.includes("document") ||
    key.includes("evidence") ||
    key.includes("file") ||
    key.includes("proof") ||
    key.includes("certificate") ||
    label.includes("서류") ||
    label.includes("증빙") ||
    label.includes("자료") ||
    label.includes("파일")
  ) {
    return "서류/증빙";
  }

  if (
    key.includes("desired") ||
    key.includes("purpose") ||
    key.includes("result") ||
    key.includes("target") ||
    key.includes("method") ||
    label.includes("원하는") ||
    label.includes("목적") ||
    label.includes("방식") ||
    label.includes("대상")
  ) {
    return "요청사항";
  }

  return "기본 정보";
}

function groupCategoryFields(fields: readonly IntakeCategoryDetailField[]) {
  const groups = ["기본 정보", "기한/긴급도", "서류/증빙", "요청사항"] as const;
  return groups
    .map((title) => ({
      title,
      fields: fields.filter((field) => getFieldGroupTitle(field) === title)
    }))
    .filter((group) => group.fields.length > 0);
}

function isRequiredCategoryField(category: IntakeCategory, field: IntakeCategoryDetailField) {
  if (category === "civil_petition") return field.key === "civilPetitionType";
  return field.key === "workType";
}

function CategoryField({
  field,
  value,
  onChange,
  required = false
}: {
  field: IntakeCategoryDetailField;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  if (field.input === "textarea") {
    return (
      <Field label="" hint={required ? "핵심 분류 질문입니다." : undefined}>
        <label className="ui-label">
          <FieldLabel label={field.label} required={required} />
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
      <Field label="" hint={required ? "핵심 분류 질문입니다." : undefined}>
        <label className="ui-label">
          <FieldLabel label={field.label} required={required} />
        </label>
        <Select required={required} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">선택해 주세요</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  return (
    <Field label="" hint={required ? "핵심 분류 질문입니다." : undefined}>
      <label className="ui-label">
        <FieldLabel label={field.label} required={required} />
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
  const [form, setForm] = useState<FormState>({
    ...initialState,
    preferredLanguage: initialLocale === "en" ? "영어" : "한국어"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [intakeAvailable, setIntakeAvailable] = useState(true);
  const [intakeMessage, setIntakeMessage] = useState("");
  const [completedMessage, setCompletedMessage] = useState("");

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
      wantsCallback: form.consultationMethod === "전화 상담",
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
      setError(intakeMessage || "현재 접수 시스템 점검 중으로 접수가 일시 중지되었습니다.");
      return;
    }

    const payload = buildPayload();
    if (!payload) {
      setError("업무 분야를 먼저 선택해 주세요.");
      return;
    }
    if (
      payload.category === "civil_petition" &&
      !(civilPetitionSubtypeValues as readonly string[]).includes(payload.categoryDetails.civilPetitionType ?? "")
    ) {
      setError("기타 민원은 민원 세부 유형을 선택해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");
    setCompletedMessage("");
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
        setError(await parseClientApiError(response, "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."));
        return;
      }

      const data = (await response.json().catch(() => null)) as IntakeResponse | null;
      setCompletedMessage(data?.inquiry?.message || COMPLETE_MESSAGE);
      if (data?.deduplicated) {
        setNotice("최근 동일 문의가 확인되어 기존 접수 흐름으로 연결했습니다.");
      }

      setForm({
        ...initialState,
        preferredLanguage: form.preferredLanguage
      });
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        setError("요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setError("문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
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
            title="업무 분야 선택"
            description="먼저 필요한 업무를 고르면 관련 질문만 이어서 정리됩니다."
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
                  <span className="block text-base font-semibold">{intakeCategoryLabels[category]}</span>
                  <span className="mt-1 block text-sm text-text-muted">{getCategoryHelp(category)}</span>
                </button>
              );
            })}
          </div>
          {selectedCategory ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-text-muted">선택한 분야</span>
                <Badge>{intakeCategoryLabels[selectedCategory]}</Badge>
              </div>
              <p className="mt-2 text-sm text-text-muted">{getCategoryGuidance(selectedCategory)}</p>
            </div>
          ) : null}
        </section>

        <section className="space-y-4 border-t border-line pt-6">
          <StepHeader
            step={2}
            title="연락처 및 상담 정보"
            description="담당자가 접수 내용을 확인하고 연락드리기 위한 기본 정보입니다."
          />
          <FieldGroup>
            <Field label="">
              <label className="ui-label">
                <FieldLabel label="이름" required />
              </label>
              <Input
                required
                minLength={2}
                maxLength={60}
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                placeholder="예: 김민지"
              />
            </Field>

            <Field label="">
              <label className="ui-label">
                <FieldLabel label="연락처" required />
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
                <FieldLabel label="이메일" required />
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
                <FieldLabel label="희망 상담 방식" />
              </label>
              <Select
                value={form.consultationMethod}
                onChange={(event) => updateField("consultationMethod", event.target.value)}
              >
                {consultationMethodOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="">
              <label className="ui-label">
                <FieldLabel label="희망 언어" />
              </label>
              <Select
                value={form.preferredLanguage}
                onChange={(event) => updateField("preferredLanguage", event.target.value)}
              >
                {preferredLanguageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="">
              <label className="ui-label">
                <FieldLabel label="긴급도" />
              </label>
              <Select
                value={form.declaredUrgency}
                onChange={(event) => updateField("declaredUrgency", event.target.value as UrgencyLevel)}
              >
                {Object.entries(urgencyOptionLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
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
              title="분야별 상세 질문"
              description="정확히 모르는 항목은 비워도 됩니다. 핵심 분류 질문만 먼저 확인합니다."
            />
            <div className="rounded-md border border-line bg-surface-muted p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{intakeCategoryLabels[selectedCategory]}</Badge>
                <span className="text-sm text-text-muted">{getCategoryGuidance(selectedCategory)}</span>
              </div>
            </div>
            <div className="space-y-5">
              {categoryFieldGroups.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h4 className="text-sm font-semibold text-text-strong">{group.title}</h4>
                  <FieldGroup>
                    {group.fields.map((field) => (
                      <CategoryField
                        key={field.key}
                        field={field}
                        required={isRequiredCategoryField(selectedCategory, field)}
                        value={form.categoryDetails[field.key] ?? ""}
                        onChange={(value) => updateCategoryDetail(field.key, value)}
                      />
                    ))}
                  </FieldGroup>
                </div>
              ))}
            </div>
            {selectedCategory === "civil_petition" && selectedCivilPetitionSubtype ? (
              <div className="space-y-4 border-t border-line pt-5">
                <div>
                  <p className="ui-kicker">{selectedCivilPetitionSubtype} 추가 질문</p>
                  <p className="mt-2 text-sm text-text-muted">
                    선택한 민원 세부 유형에 맞춰 필요한 추가 정보를 확인합니다.
                  </p>
                </div>
                <div className="space-y-5">
                  {civilPetitionSubtypeFieldGroups.map((group) => (
                    <div key={group.title} className="space-y-3">
                      <h4 className="text-sm font-semibold text-text-strong">{group.title}</h4>
                      <FieldGroup>
                        {group.fields.map((field) => (
                          <CategoryField
                            key={field.key}
                            field={field}
                            value={form.categoryDetails[field.key] ?? ""}
                            onChange={(value) => updateCategoryDetail(field.key, value)}
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
            title="사건 개요 및 서류"
            description="현재 상황과 보유 자료를 알려 주시면 담당자가 확인할 범위를 줄일 수 있습니다."
          />
          <FieldGroup>
            <Field label="" hint="현재 상황, 원하는 결과, 기한을 중심으로 적어 주세요.">
              <label className="ui-label">
                <FieldLabel label="사건/업무 개요" required />
              </label>
              <Textarea
                required
                rows={7}
                minLength={20}
                maxLength={2000}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="예: 현재 상황, 필요한 업무, 마감일, 보유 자료를 알려 주세요."
              />
            </Field>

            <Field label="">
              <label className="ui-label">
                <FieldLabel label="관련 서류 보유 여부" />
              </label>
              <Select
                value={form.documentAvailability}
                onChange={(event) => updateField("documentAvailability", event.target.value)}
              >
                {documentAvailabilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldGroup>
        </section>

        <section className="space-y-4 border-t border-line pt-6">
          <StepHeader
            step={5}
            title="동의 및 제출"
            description="제출 전 선택한 접수 내용을 한 번만 확인해 주세요."
          />
          <div className="rounded-md border border-line bg-surface-muted p-4">
            <p className="text-sm font-semibold text-text-strong">제출 전 요약</p>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-text-muted">업무 분야</dt>
                <dd className="font-medium text-text-strong">
                  {selectedCategory ? intakeCategoryLabels[selectedCategory] : "선택 전"}
                </dd>
              </div>
              {selectedCategory === "civil_petition" && selectedCivilPetitionSubtype ? (
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <dt className="text-text-muted">민원 세부 유형</dt>
                  <dd className="font-medium text-text-strong">{selectedCivilPetitionSubtype}</dd>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-text-muted">희망 상담 방식</dt>
                <dd className="font-medium text-text-strong">{form.consultationMethod}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-text-muted">희망 언어</dt>
                <dd className="font-medium text-text-strong">{form.preferredLanguage}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-text-muted">긴급도</dt>
                <dd className="font-medium text-text-strong">{urgencyOptionLabels[form.declaredUrgency]}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <dt className="text-text-muted">관련 서류</dt>
                <dd className="font-medium text-text-strong">{form.documentAvailability}</dd>
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
              개인정보 수집 및 이용에 동의합니다.
            </span>
          </label>

          {error ? <StateInline tone="error">{error}</StateInline> : null}
          {!error && notice ? <StateInline tone="success">{notice}</StateInline> : null}

          <Button type="submit" disabled={isSubmitting || !intakeAvailable} size="lg" fullWidth>
            {isSubmitting ? "접수 중..." : "접수하기"}
          </Button>
        </section>
      </form>

      {completedMessage ? (
        <section className="rounded-md border border-line bg-surface-muted p-5">
          <p className="ui-kicker">접수 완료</p>
          <p className="mt-2 text-base font-semibold text-text-strong">{COMPLETE_MESSAGE}</p>
        </section>
      ) : null}
    </div>
  );
}
