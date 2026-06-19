"use client";

import { Field, FieldGroup } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  documentAvailabilityOptions,
  type IntakeCategoryDisplayLocale
} from "@/types/intake-category";

import { FieldLabel, StepHeader } from "./intake-step-shared";
import type {
  FormState,
  GetCommonOptionLabel,
  IntakeFormCopy
} from "../intake-types";

export function IntakeStepSummary({
  copy,
  locale,
  form,
  updateField,
  getCommonOptionLabel
}: {
  copy: IntakeFormCopy;
  locale: IntakeCategoryDisplayLocale;
  form: FormState;
  updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  getCommonOptionLabel: GetCommonOptionLabel;
}) {
  return (
    <section className="space-y-4 border-t border-line pt-6">
      <StepHeader step={4} title={copy.step4Title} description={copy.step4Description} />
      <FieldGroup>
        <Field
          label=""
          hint={
            locale === "en"
              ? "Summarize current status, desired outcome, deadline, and documents."
              : "현재 상황, 원하는 결과, 기한, 보유 자료를 중심으로 적어 주세요."
          }
        >
          <label className="ui-label">
            <FieldLabel label={copy.description} required locale={locale} copy={copy} />
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
            <FieldLabel label={copy.documentAvailability} locale={locale} copy={copy} />
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
  );
}
