"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { getIntakeCopy } from "@/components/intake/copy-safe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StateInline } from "@/components/ui/state-panel";
import { Textarea } from "@/components/ui/textarea";
import { parseClientApiError } from "@/lib/http/client-api";
import {
  inquiryTypeLabels,
  inquiryTypeValues,
  urgencyLabels,
  urgencyValues,
  type Locale
} from "@/types/inquiry";

type IntakeResponse = {
  deduplicated?: boolean;
  inquiry: {
    id: string;
    inquiryType: keyof typeof inquiryTypeLabels;
    urgencyLevel: keyof typeof urgencyLabels;
    generatedSummary: string;
    generatedGuidance: string;
    generatedReceiptMessage: string;
    consultationRequired: boolean;
    riskComplexityHint?: string | null;
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
  preferredLocale: "ko" | "en";
  clientType: "INDIVIDUAL" | "COMPANY";
  contactName: string;
  organizationName: string;
  email: string;
  phone: string;
  title: string;
  description: string;
  requestedInquiryType: keyof typeof inquiryTypeLabels;
  requestedOutcome: string;
  declaredUrgency: keyof typeof urgencyLabels;
  nationality: string;
  currentStatus: string;
  documentCountry: string;
  targetAgency: string;
  hasPreparedDocuments: boolean;
  needsTranslation: boolean;
  isCorporateRequest: boolean;
  dueDate: string;
  website: string;
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
  website: "",
  wantsCallback: false,
  consentToPrivacy: false
};

const INTAKE_SUBMIT_TIMEOUT_MS = 12_000;

export function IntakeFormSafeV3({ initialLocale }: { initialLocale: Locale }) {
  const normalizedLocale = initialLocale === "en" ? "en" : "ko";
  const [locale, setLocale] = useState<FormState["preferredLocale"]>(normalizedLocale);
  const [form, setForm] = useState<FormState>({
    ...initialState,
    preferredLocale: normalizedLocale
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [intakeAvailable, setIntakeAvailable] = useState(true);
  const [intakeMessage, setIntakeMessage] = useState("");
  const [result, setResult] = useState<IntakeResponse["inquiry"] | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const copy = useMemo(() => getIntakeCopy(locale), [locale]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchIntakeAvailability() {
      try {
        const response = await fetch("/api/inquiries", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept: "application/json"
          }
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

    void fetchIntakeAvailability();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intakeAvailable) {
      setError(intakeMessage || copy.errorMaintenance);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    let timeoutId: number | undefined;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), INTAKE_SUBMIT_TIMEOUT_MS);

      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...form,
          preferredLocale: locale,
          isCorporateRequest: form.clientType === "COMPANY" || form.isCorporateRequest
        })
      });

      if (!response.ok) {
        setError(await parseClientApiError(response, copy.errorGeneric));
        return;
      }

      const data = (await response.json().catch(() => null)) as IntakeResponse | null;
      if (!data?.inquiry) {
        setError(copy.errorGeneric);
        return;
      }

      setResult(data.inquiry);
      if (data.deduplicated) {
        setNotice(copy.notices.deduplicated);
      }

      setForm({
        ...initialState,
        preferredLocale: locale
      });
      setShowOptional(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setError(copy.errorTimeout);
        return;
      }

      setError(copy.errorGeneric);
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
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

        <Card className="p-6">
          <p className="ui-kicker">{copy.sections.basic}</p>
          <FieldGroup className="mt-4 sm:grid-cols-2">
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
                onChange={(event) => {
                  const nextClientType = event.target.value as FormState["clientType"];
                  setForm((current) => ({
                    ...current,
                    clientType: nextClientType,
                    organizationName: nextClientType === "COMPANY" ? current.organizationName : "",
                    isCorporateRequest: nextClientType === "COMPANY"
                  }));
                }}
              >
                <option value="INDIVIDUAL">{copy.clientTypeOptions.INDIVIDUAL}</option>
                <option value="COMPANY">{copy.clientTypeOptions.COMPANY}</option>
              </Select>
            </Field>
            <Field label={copy.labels.contactName}>
              <Input
                required
                minLength={2}
                maxLength={60}
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                placeholder={copy.placeholders.contactName}
              />
            </Field>
            {form.clientType === "COMPANY" ? (
              <Field label={copy.labels.organizationName}>
                <Input
                  maxLength={100}
                  value={form.organizationName}
                  onChange={(event) => updateField("organizationName", event.target.value)}
                  placeholder={copy.placeholders.organizationName}
                />
              </Field>
            ) : null}
            <Field label={copy.labels.email}>
              <Input
                required
                type="email"
                maxLength={254}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder={copy.placeholders.email}
              />
            </Field>
            <Field label={copy.labels.phone}>
              <Input
                maxLength={30}
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder={copy.placeholders.phone}
              />
            </Field>
            <Field label={copy.labels.title} hint={copy.hints.titleMin} className="sm:col-span-2">
              <Input
                required
                minLength={4}
                maxLength={120}
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder={copy.placeholders.title}
              />
            </Field>
            <Field label={copy.labels.description} hint={copy.hints.descriptionMin} className="sm:col-span-2">
              <Textarea
                required
                rows={7}
                minLength={20}
                maxLength={2000}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder={copy.placeholders.description}
              />
            </Field>
            <Field label={copy.labels.requestedOutcome} className="sm:col-span-2">
              <Textarea
                rows={3}
                maxLength={400}
                value={form.requestedOutcome}
                onChange={(event) => updateField("requestedOutcome", event.target.value)}
                placeholder={copy.placeholders.requestedOutcome}
              />
            </Field>
          </FieldGroup>
        </Card>

        <Card muted className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="ui-kicker">{copy.sections.optional}</p>
              <p className="mt-2 text-sm text-text-muted">{copy.hints.optional}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowOptional((current) => !current)}
            >
              {showOptional ? copy.buttons.hideOptional : copy.buttons.showOptional}
            </Button>
          </div>

          {showOptional ? (
            <FieldGroup className="mt-4 sm:grid-cols-2">
              <Field label={copy.labels.requestedInquiryType}>
                <Select
                  value={form.requestedInquiryType}
                  onChange={(event) =>
                    updateField("requestedInquiryType", event.target.value as FormState["requestedInquiryType"])
                  }
                >
                  {inquiryTypeValues.map((value) => (
                    <option key={value} value={value}>
                      {value === "UNKNOWN" ? copy.resultLabels.notSelected : inquiryTypeLabels[value][locale]}
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
                  maxLength={80}
                  value={form.nationality}
                  onChange={(event) => updateField("nationality", event.target.value)}
                  placeholder={copy.placeholders.nationality}
                />
              </Field>
              <Field label={copy.labels.currentStatus}>
                <Input
                  maxLength={120}
                  value={form.currentStatus}
                  onChange={(event) => updateField("currentStatus", event.target.value)}
                  placeholder={copy.placeholders.currentStatus}
                />
              </Field>
              <Field label={copy.labels.documentCountry}>
                <Input
                  maxLength={80}
                  value={form.documentCountry}
                  onChange={(event) => updateField("documentCountry", event.target.value)}
                  placeholder={copy.placeholders.documentCountry}
                />
              </Field>
              <Field label={copy.labels.targetAgency}>
                <Input
                  maxLength={120}
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
              <div className="grid gap-3 sm:col-span-2">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.needsTranslation}
                    onChange={(event) => updateField("needsTranslation", event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-line text-primary"
                  />
                  <span className="text-sm font-semibold text-text-strong">{copy.optionLabels.translationYes}</span>
                </label>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.hasPreparedDocuments}
                    onChange={(event) => updateField("hasPreparedDocuments", event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-line text-primary"
                  />
                  <span className="text-sm font-semibold text-text-strong">{copy.optionLabels.documentsReady}</span>
                </label>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.wantsCallback}
                    onChange={(event) => updateField("wantsCallback", event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-line text-primary"
                  />
                  <span className="text-sm font-semibold text-text-strong">{copy.labels.wantsCallback}</span>
                </label>
              </div>
            </FieldGroup>
          ) : null}
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
            <span className="text-sm font-semibold text-text-strong">{copy.labels.consentToPrivacy}</span>
          </label>
        </Card>

        {error ? <StateInline tone="error">{error}</StateInline> : null}
        {!error && notice ? <StateInline tone="success">{notice}</StateInline> : null}

        <Button type="submit" disabled={isSubmitting || !intakeAvailable} size="lg">
          {isSubmitting ? copy.buttons.submitting : copy.buttons.submit}
        </Button>
      </form>

      {result ? (
        <Card muted className="p-5">
          <div className="flex flex-wrap gap-2">
            <Badge>{result.id}</Badge>
            <Badge>{inquiryTypeLabels[result.inquiryType][locale]}</Badge>
            <Badge tone="urgency" urgency={result.urgencyLevel}>
              {urgencyLabels[result.urgencyLevel][locale]}
            </Badge>
          </div>
          <div className="mt-4 space-y-3">
            <Card className="p-4">
              <p className="ui-kicker">{copy.resultLabels.summary}</p>
              <p className="mt-2 text-sm text-text">{result.generatedSummary}</p>
            </Card>
            <Card className="p-4">
              <p className="ui-kicker">{copy.resultLabels.receipt}</p>
              <p className="mt-2 text-sm text-text">{result.generatedReceiptMessage}</p>
            </Card>
            <Button type="button" variant="secondary" onClick={() => setResult(null)}>
              {copy.buttons.resetResult}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
