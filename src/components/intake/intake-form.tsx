"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StateInline } from "@/components/ui/state-panel";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getIntakeCopy } from "@/components/intake/copy";
import {
  inquiryTypeLabels,
  inquiryTypeValues,
  urgencyLabels,
  urgencyValues,
  type Locale
} from "@/types/inquiry";

type IntakeResponse = {
  inquiry: {
    id: string;
    generatedReceiptMessage: string;
  };
};

type FormState = {
  preferredLocale: "ko" | "en";
  clientType: "INDIVIDUAL" | "COMPANY";
  contactName: string;
  organizationName: string;
  email: string;
  phone: string;
  title: string;
  description: string;
  requestedInquiryType: (typeof inquiryTypeValues)[number];
  requestedOutcome: string;
  declaredUrgency: (typeof urgencyValues)[number];
  nationality: string;
  currentStatus: string;
  documentCountry: string;
  targetAgency: string;
  hasPreparedDocuments: boolean;
  needsTranslation: boolean;
  isCorporateRequest: boolean;
  dueDate: string;
  wantsCallback: boolean;
  consentToPrivacy: boolean;
};

const initialState: FormState = {
  preferredLocale: "ko",
  clientType: "INDIVIDUAL",
  contactName: "",
  organizationName: "",
  email: "",
  phone: "",
  title: "",
  description: "",
  requestedInquiryType: "UNKNOWN",
  requestedOutcome: "",
  declaredUrgency: "MEDIUM",
  nationality: "",
  currentStatus: "",
  documentCountry: "",
  targetAgency: "",
  hasPreparedDocuments: false,
  needsTranslation: false,
  isCorporateRequest: false,
  dueDate: "",
  wantsCallback: false,
  consentToPrivacy: false
};

export function IntakeForm({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState<FormState["preferredLocale"]>(initialLocale === "en" ? "en" : "ko");
  const [form, setForm] = useState<FormState>({
    ...initialState,
    preferredLocale: initialLocale === "en" ? "en" : "ko"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IntakeResponse["inquiry"] | null>(null);
  const copy = useMemo(() => getIntakeCopy(locale), [locale]);
  const successTitle = locale === "ko" ? "접수가 완료되었습니다." : "Your inquiry has been submitted.";
  const successDescription =
    locale === "ko"
      ? "관리자 검토 후 순차적으로 안내드리겠습니다. 필요하면 접수번호를 보관해 주세요."
      : "Your inquiry has been received. Please keep the reference number if you need to follow up.";
  const successResetLabel = locale === "ko" ? "새 문의 작성" : "Start another inquiry";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          preferredLocale: locale
        })
      });

      const data = (await response.json()) as IntakeResponse & { error?: string };

      if (!response.ok) {
        setError(data.error ?? copy.errorGeneric);
        return;
      }

      setResult(data.inquiry);
      setForm({
        ...initialState,
        preferredLocale: locale
      });
    } catch {
      setError(copy.errorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <FieldGroup className="sm:grid-cols-2">
            <Field label={copy.labels.preferredLocale} className="sm:col-span-2">
              <div className="flex gap-2">
                {(["ko", "en"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={locale === value ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => {
                      setLocale(value);
                      updateField("preferredLocale", value);
                    }}
                  >
                    {value === "ko" ? "한국어" : "English"}
                  </Button>
                ))}
              </div>
            </Field>

            <Field label={copy.labels.clientType}>
              <Select
                value={form.clientType}
                onChange={(event) =>
                  updateField("clientType", event.target.value as FormState["clientType"])
                }
              >
                <option value="INDIVIDUAL">{copy.clientTypeOptions.INDIVIDUAL}</option>
                <option value="COMPANY">{copy.clientTypeOptions.COMPANY}</option>
              </Select>
            </Field>
            <Field label={copy.labels.contactName}>
              <Input
                required
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                placeholder={copy.placeholders.contactName}
              />
            </Field>
            <Field label={copy.labels.organizationName}>
              <Input
                value={form.organizationName}
                onChange={(event) => updateField("organizationName", event.target.value)}
                placeholder={copy.placeholders.organizationName}
              />
            </Field>
            <Field label={copy.labels.email}>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder={copy.placeholders.email}
              />
            </Field>
            <Field label={copy.labels.phone}>
              <Input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder={copy.placeholders.phone}
              />
            </Field>
            <Field label={copy.labels.title} className="sm:col-span-2">
              <Input
                required
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder={copy.placeholders.title}
              />
            </Field>
            <Field label={copy.labels.description} className="sm:col-span-2">
              <Textarea
                required
                rows={7}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder={copy.placeholders.description}
              />
            </Field>
            <Field label={copy.labels.requestedOutcome} className="sm:col-span-2">
              <Textarea
                rows={3}
                value={form.requestedOutcome}
                onChange={(event) => updateField("requestedOutcome", event.target.value)}
                placeholder={copy.placeholders.requestedOutcome}
              />
            </Field>
            <Field label={copy.labels.requestedInquiryType}>
              <Select
                value={form.requestedInquiryType}
                onChange={(event) =>
                  updateField(
                    "requestedInquiryType",
                    event.target.value as FormState["requestedInquiryType"]
                  )
                }
              >
                {inquiryTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {inquiryTypeLabels[value][locale]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={copy.labels.declaredUrgency}>
              <Select
                value={form.declaredUrgency}
                onChange={(event) =>
                  updateField("declaredUrgency", event.target.value as FormState["declaredUrgency"])
                }
              >
                {urgencyValues.map((value) => (
                  <option key={value} value={value}>
                    {urgencyLabels[value][locale]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={copy.labels.nationality}>
              <Input
                value={form.nationality}
                onChange={(event) => updateField("nationality", event.target.value)}
                placeholder={copy.placeholders.nationality}
              />
            </Field>
            <Field label={copy.labels.currentStatus}>
              <Input
                value={form.currentStatus}
                onChange={(event) => updateField("currentStatus", event.target.value)}
                placeholder={copy.placeholders.currentStatus}
              />
            </Field>
            <Field label={copy.labels.documentCountry}>
              <Input
                value={form.documentCountry}
                onChange={(event) => updateField("documentCountry", event.target.value)}
                placeholder={copy.placeholders.documentCountry}
              />
            </Field>
            <Field label={copy.labels.targetAgency}>
              <Input
                value={form.targetAgency}
                onChange={(event) => updateField("targetAgency", event.target.value)}
                placeholder={copy.placeholders.targetAgency}
              />
            </Field>
            <Field label={copy.labels.dueDate}>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
              />
            </Field>
          </FieldGroup>
        </Card>

        <Card muted className="p-5">
          <div className="grid gap-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.isCorporateRequest}
                onChange={(event) => updateField("isCorporateRequest", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-line text-primary"
              />
              <span className="text-sm font-semibold text-text-strong">
                {copy.labels.isCorporateRequest} / {copy.optionLabels.corporateYes}
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.needsTranslation}
                onChange={(event) => updateField("needsTranslation", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-line text-primary"
              />
              <span className="text-sm font-semibold text-text-strong">
                {copy.labels.needsTranslation} / {copy.optionLabels.translationYes}
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.hasPreparedDocuments}
                onChange={(event) => updateField("hasPreparedDocuments", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-line text-primary"
              />
              <span className="text-sm font-semibold text-text-strong">
                {copy.labels.hasPreparedDocuments} / {copy.optionLabels.documentsReady}
              </span>
            </label>
          </div>
        </Card>

        <Card muted className="p-5">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.wantsCallback}
              onChange={(event) => updateField("wantsCallback", event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-line text-primary"
            />
            <span>
              <span className="block text-sm font-semibold text-text-strong">
                {copy.labels.wantsCallback}
              </span>
              <span className="mt-1 block text-sm text-text-muted">{copy.callbackHelp}</span>
            </span>
          </label>
        </Card>

        <Card muted className="p-5">
          <label className="flex items-start gap-3">
            <input
              required
              type="checkbox"
              checked={form.consentToPrivacy}
              onChange={(event) => updateField("consentToPrivacy", event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-line text-primary"
            />
            <span className="text-sm font-semibold text-text-strong">
              {copy.labels.consentToPrivacy}
            </span>
          </label>
        </Card>

        {error ? <StateInline tone="error">{error}</StateInline> : null}

        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? copy.buttons.submitting : copy.buttons.submit}
        </Button>
      </form>

      <div className="space-y-4">
        <Card muted className="p-5">
          <p className="text-lg font-semibold text-text-strong">
            {result ? successTitle : copy.resultTitle}
          </p>
          <p className="mt-2 text-sm text-text-muted">
            {result ? successDescription : copy.resultDescription}
          </p>
          {result ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                  Reference
                </p>
                <p className="mt-2 text-sm font-semibold text-text-strong">{result.id}</p>
              </div>
              <Card className="p-4">
                <p className="ui-kicker">Confirmation</p>
                <p className="mt-2 text-sm text-text">{result.generatedReceiptMessage}</p>
              </Card>
              <Button type="button" variant="secondary" onClick={() => setResult(null)}>
                {successResetLabel}
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">{copy.emptyResult}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
