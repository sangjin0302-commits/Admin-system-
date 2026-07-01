"use client";

import { useState } from "react";

import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { UrgencyLevel } from "@/types/inquiry";
import {
  consultationMethodOptions,
  preferredLanguageOptions,
  urgencyOptionLabels,
  type IntakeCategoryDisplayLocale
} from "@/types/intake-category";

import { FieldLabel, StepHeader } from "./intake-step-shared";
import type {
  FormState,
  GetCommonOptionLabel,
  GetUrgencyDisplayLabel,
  IntakeFormCopy
} from "../intake-types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactFieldKey = "contactName" | "phone" | "email";

const contactErrorCopy: Record<IntakeCategoryDisplayLocale, Record<ContactFieldKey, string>> = {
  ko: {
    contactName: "이름을 2자 이상 입력해 주세요.",
    phone: "연락 가능한 전화번호를 입력해 주세요. (예: 010-0000-0000)",
    email: "올바른 이메일 형식으로 입력해 주세요."
  },
  en: {
    contactName: "Please enter at least 2 characters.",
    phone: "Please enter a reachable phone number. (e.g. 010-0000-0000)",
    email: "Please enter a valid email address."
  }
};

function getFieldError(key: ContactFieldKey, value: string): boolean {
  if (key === "contactName") return value.trim().length < 2;
  if (key === "phone") return value.replace(/\D/g, "").length < 9;
  return !EMAIL_RE.test(value.trim());
}

export function IntakeStepContact({
  copy,
  locale,
  form,
  updateField,
  getCommonOptionLabel,
  getUrgencyDisplayLabel
}: {
  copy: IntakeFormCopy;
  locale: IntakeCategoryDisplayLocale;
  form: FormState;
  updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  getCommonOptionLabel: GetCommonOptionLabel;
  getUrgencyDisplayLabel: GetUrgencyDisplayLabel;
}) {
  const [touched, setTouched] = useState<Partial<Record<ContactFieldKey, boolean>>>({});

  function markTouched(key: ContactFieldKey) {
    setTouched((current) => ({ ...current, [key]: true }));
  }

  function fieldStateClass(key: ContactFieldKey, value: string) {
    if (!touched[key]) return undefined;
    return getFieldError(key, value) ? "ui-input-error" : "ui-input-success";
  }

  function fieldErrorText(key: ContactFieldKey, value: string) {
    if (!touched[key] || !getFieldError(key, value)) return null;
    return (
      <p className="ui-field-error-text" role="alert">
        {contactErrorCopy[locale][key]}
      </p>
    );
  }

  return (
    <section className="space-y-4 border-t border-line pt-6">
      <StepHeader step={2} title={copy.step2Title} description={copy.step2Description} />
      <FieldGroup>
        <Field label="">
          <label className="ui-label">
            <FieldLabel label={copy.name} required locale={locale} copy={copy} />
          </label>
          <Input
            required
            minLength={2}
            maxLength={60}
            value={form.contactName}
            aria-invalid={touched.contactName ? getFieldError("contactName", form.contactName) : undefined}
            className={fieldStateClass("contactName", form.contactName)}
            onBlur={() => markTouched("contactName")}
            onChange={(event) => updateField("contactName", event.target.value)}
            placeholder={locale === "en" ? "Full name" : "예: 김민수"}
          />
          {fieldErrorText("contactName", form.contactName)}
        </Field>

        <Field label="">
          <label className="ui-label">
            <FieldLabel label={copy.phone} required locale={locale} copy={copy} />
          </label>
          <Input
            required
            type="tel"
            inputMode="tel"
            maxLength={30}
            value={form.phone}
            aria-invalid={touched.phone ? getFieldError("phone", form.phone) : undefined}
            className={fieldStateClass("phone", form.phone)}
            onBlur={() => markTouched("phone")}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="010-0000-0000"
          />
          {fieldErrorText("phone", form.phone)}
        </Field>

        <Field label="">
          <label className="ui-label">
            <FieldLabel label={copy.email} required locale={locale} copy={copy} />
          </label>
          <Input
            required
            type="email"
            maxLength={254}
            value={form.email}
            aria-invalid={touched.email ? getFieldError("email", form.email) : undefined}
            className={fieldStateClass("email", form.email)}
            onBlur={() => markTouched("email")}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="example@email.com"
          />
          {fieldErrorText("email", form.email)}
        </Field>

        <Field label="">
          <label className="ui-label">
            <FieldLabel label={copy.consultationMethod} locale={locale} copy={copy} />
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
            <FieldLabel label={copy.preferredLanguage} locale={locale} copy={copy} />
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
            <FieldLabel label={copy.urgency} locale={locale} copy={copy} />
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
  );
}
