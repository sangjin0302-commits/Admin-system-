"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getLocalizedIntakeFieldLabel,
  getLocalizedIntakeOptionLabel,
  type IntakeCategory,
  type IntakeCategoryDetailField,
  type IntakeCategoryDisplayLocale
} from "@/types/intake-category";

import type { IntakeFormCopy } from "../intake-types";

export function StepHeader({
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

export function FieldBadge({
  required,
  locale,
  copy
}: {
  required?: boolean;
  locale: IntakeCategoryDisplayLocale;
  copy: IntakeFormCopy;
}) {
  void locale;
  return (
    <span className={required ? "ui-status-pill intake-pill-required" : "ui-status-pill intake-pill-optional"}>
      {required ? copy.required : copy.optional}
    </span>
  );
}

export function FieldLabel({
  label,
  required,
  locale,
  copy
}: {
  label: string;
  required?: boolean;
  locale: IntakeCategoryDisplayLocale;
  copy: IntakeFormCopy;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>{label}</span>
      <FieldBadge required={required} locale={locale} copy={copy} />
    </span>
  );
}

export function CategoryField({
  field,
  category,
  value,
  onChange,
  required = false,
  locale,
  copy
}: {
  field: IntakeCategoryDetailField;
  category: IntakeCategory | null;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  locale: IntakeCategoryDisplayLocale;
  copy: IntakeFormCopy;
}) {
  const label = getLocalizedIntakeFieldLabel(field, locale);

  if (field.input === "textarea") {
    return (
      <Field label="" hint={required ? copy.coreHint : undefined}>
        <label className="ui-label">
          <FieldLabel label={label} required={required} locale={locale} copy={copy} />
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
          <FieldLabel label={label} required={required} locale={locale} copy={copy} />
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
        <FieldLabel label={label} required={required} locale={locale} copy={copy} />
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
