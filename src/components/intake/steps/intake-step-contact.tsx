"use client";

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
            onChange={(event) => updateField("contactName", event.target.value)}
            placeholder={locale === "en" ? "Full name" : "예: 김민수"}
          />
        </Field>

        <Field label="">
          <label className="ui-label">
            <FieldLabel label={copy.phone} required locale={locale} copy={copy} />
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
            <FieldLabel label={copy.email} required locale={locale} copy={copy} />
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
