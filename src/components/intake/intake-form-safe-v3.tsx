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
  consultationMethodOptions,
  documentAvailabilityOptions,
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
    arabic_translation: "번역 방향, 인증 필요성, 제출 기관을 기준으로 납기와 범위를 확인합니다."
  };
  return help[category];
}

function CategoryField({
  field,
  value,
  onChange
}: {
  field: IntakeCategoryDetailField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.input === "textarea") {
    return (
      <Field label={field.label}>
        <Textarea
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
      <Field label={field.label}>
        <Select value={value} onChange={(event) => onChange(event.target.value)}>
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
    <Field label={field.label}>
      <Input
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
        ...current.categoryDetails,
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
    const categoryDetails = {
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
        form.categoryDetails.submissionAgency ??
        "",
      hasPreparedDocuments: getBooleanFromAvailability(form.documentAvailability),
      needsTranslation: selectedCategory === "arabic_translation",
      isCorporateRequest: intakeCategoryClientTypeMap[selectedCategory] === "COMPANY",
      wantsCallback: form.consultationMethod === "전화 상담",
      dueDate:
        form.categoryDetails.desiredDeadline ??
        form.categoryDetails.desiredCompletionDate ??
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

        <section className="space-y-3">
          <div>
            <p className="ui-kicker">업무 분야</p>
            <h3 className="mt-2 text-lg font-semibold text-text-strong">필요한 업무를 먼저 선택해 주세요</h3>
            <p className="mt-2 text-sm text-text-muted">
              선택한 분야에 맞춰 필요한 질문만 이어서 표시됩니다.
            </p>
          </div>
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-text-muted">선택한 분야</span>
              <Badge>{intakeCategoryLabels[selectedCategory]}</Badge>
            </div>
          ) : null}
        </section>

        <section className="space-y-4 border-t border-line pt-6">
          <div>
            <p className="ui-kicker">공통 정보</p>
            <p className="mt-2 text-sm text-text-muted">
              담당자가 접수 내용을 확인하고 연락드리기 위한 기본 정보입니다.
            </p>
          </div>
          <FieldGroup>
            <Field label="이름">
              <Input
                required
                minLength={2}
                maxLength={60}
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                placeholder="예: 김민지"
              />
            </Field>

            <Field label="연락처">
              <Input
                maxLength={30}
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="010-0000-0000"
              />
            </Field>

            <Field label="이메일">
              <Input
                required
                type="email"
                maxLength={254}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="example@email.com"
              />
            </Field>

            <Field label="희망 상담 방식">
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

            <Field label="희망 언어">
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

            <Field label="긴급도">
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

            <Field label="사건/업무 개요" hint="현재 상황, 원하는 결과, 기한을 중심으로 적어 주세요.">
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

            <Field label="관련 서류 보유 여부">
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

        {selectedCategory ? (
          <section className="space-y-4 border-t border-line pt-6">
            <div>
              <p className="ui-kicker">{intakeCategoryLabels[selectedCategory]} 세부 정보</p>
              <p className="mt-2 text-sm text-text-muted">
                정확히 모르는 항목은 비워도 됩니다. 담당자가 확인 후 필요한 자료를 안내합니다.
              </p>
            </div>
            <FieldGroup>
              {selectedCategoryFields.map((field) => (
                <CategoryField
                  key={field.key}
                  field={field}
                  value={form.categoryDetails[field.key] ?? ""}
                  onChange={(value) => updateCategoryDetail(field.key, value)}
                />
              ))}
            </FieldGroup>
          </section>
        ) : null}

        <section className="space-y-4 border-t border-line pt-6">
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
