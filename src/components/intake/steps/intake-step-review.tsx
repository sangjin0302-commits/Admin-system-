"use client";

import { Button } from "@/components/ui/button";
import { StateInline } from "@/components/ui/state-panel";
import {
  getLocalizedIntakeCategoryLabel,
  type IntakeCategory,
  type IntakeCategoryDisplayLocale
} from "@/types/intake-category";

import { StepHeader } from "./intake-step-shared";
import type {
  FormState,
  GetCommonOptionLabel,
  GetCommonSubtypeDisplay,
  GetUrgencyDisplayLabel,
  IntakeFormCopy
} from "../intake-types";

export function IntakeStepReview({
  copy,
  locale,
  form,
  selectedCategory,
  selectedCivilPetitionSubtype,
  updateField,
  getCommonOptionLabel,
  getUrgencyDisplayLabel,
  getCommonSubtypeDisplay,
  error,
  notice,
  isSubmitting,
  intakeAvailable
}: {
  copy: IntakeFormCopy;
  locale: IntakeCategoryDisplayLocale;
  form: FormState;
  selectedCategory: IntakeCategory | null;
  selectedCivilPetitionSubtype: string | undefined;
  updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  getCommonOptionLabel: GetCommonOptionLabel;
  getUrgencyDisplayLabel: GetUrgencyDisplayLabel;
  getCommonSubtypeDisplay: GetCommonSubtypeDisplay;
  error: string;
  notice: string;
  isSubmitting: boolean;
  intakeAvailable: boolean;
}) {
  return (
    <section className="space-y-4 border-t border-line pt-6">
      <StepHeader step={5} title={copy.step5Title} description={copy.step5Description} />
      <div className="rounded-md border border-line bg-surface-muted p-4">
        <p className="text-sm font-semibold text-text-strong">{copy.summaryTitle}</p>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <dt className="text-text-muted">{copy.serviceCategory}</dt>
            <dd className="font-medium text-text-strong">
              {selectedCategory
                ? getLocalizedIntakeCategoryLabel(selectedCategory, locale)
                : copy.selectedFallback}
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
        <span className="text-sm font-semibold text-text-strong">{copy.privacyConsent}</span>
      </label>

      {error ? <StateInline tone="error">{error}</StateInline> : null}
      {!error && notice ? <StateInline tone="success">{notice}</StateInline> : null}

      <Button type="submit" disabled={isSubmitting || !intakeAvailable} size="lg" fullWidth>
        {isSubmitting ? copy.submitting : copy.submit}
      </Button>
    </section>
  );
}
