"use client";

import { useMemo, useState, type FormEvent, type PropsWithChildren } from "react";

import { getMessages } from "@/lib/i18n/messages";
import { inquiryTypeLabels, urgencyLabels, type Locale } from "@/types/inquiry";

type IntakeResponse = {
  inquiry: {
    id: string;
    inquiryType: keyof typeof inquiryTypeLabels;
    urgencyLevel: keyof typeof urgencyLabels;
    generatedSummary: string;
    generatedGuidance: string;
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
  nationality: string;
  currentStatus: string;
  documentCountry: string;
  targetAgency: string;
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
  nationality: "",
  currentStatus: "",
  documentCountry: "",
  targetAgency: "",
  dueDate: "",
  wantsCallback: false,
  consentToPrivacy: false
};

export function IntakeForm({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState<FormState["preferredLocale"]>(
    initialLocale === "en" ? "en" : "ko"
  );
  const [form, setForm] = useState<FormState>({
    ...initialState,
    preferredLocale: initialLocale === "en" ? "en" : "ko"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IntakeResponse["inquiry"] | null>(null);

  const messages = useMemo(() => getMessages(locale), [locale]);

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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          preferredLocale: locale
        })
      });

      const data = (await response.json()) as IntakeResponse & { error?: string };

      if (!response.ok) {
        setError(data.error ?? messages.errors.generic);
        return;
      }

      setResult(data.inquiry);
      setForm({
        ...initialState,
        preferredLocale: locale
      });
    } catch {
      setError(messages.errors.generic);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {messages.labels.preferredLocale}
            </label>
            <div className="flex gap-2">
              {(["ko", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setLocale(lang);
                    updateField("preferredLocale", lang);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    locale === lang
                      ? "bg-ink text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {lang === "ko" ? "한국어" : "English"}
                </button>
              ))}
            </div>
          </div>

          <Field label={messages.labels.clientType}>
            <select
              value={form.clientType}
              onChange={(event) =>
                updateField("clientType", event.target.value as FormState["clientType"])
              }
              className="input"
            >
              <option value="INDIVIDUAL">{messages.clientTypeOptions.INDIVIDUAL}</option>
              <option value="COMPANY">{messages.clientTypeOptions.COMPANY}</option>
            </select>
          </Field>

          <Field label={messages.labels.contactName}>
            <input
              required
              value={form.contactName}
              onChange={(event) => updateField("contactName", event.target.value)}
              placeholder={messages.placeholders.contactName}
              className="input"
            />
          </Field>

          <Field label={messages.labels.organizationName}>
            <input
              value={form.organizationName}
              onChange={(event) => updateField("organizationName", event.target.value)}
              placeholder={messages.placeholders.organizationName}
              className="input"
            />
          </Field>

          <Field label={messages.labels.email}>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder={messages.placeholders.email}
              className="input"
            />
          </Field>

          <Field label={messages.labels.phone}>
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder={messages.placeholders.phone}
              className="input"
            />
          </Field>

          <Field label={messages.labels.title} className="sm:col-span-2">
            <input
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={messages.placeholders.title}
              className="input"
            />
          </Field>

          <Field label={messages.labels.description} className="sm:col-span-2">
            <textarea
              required
              rows={7}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder={messages.placeholders.description}
              className="input min-h-[180px] resize-y"
            />
          </Field>

          <Field label={messages.labels.nationality}>
            <input
              value={form.nationality}
              onChange={(event) => updateField("nationality", event.target.value)}
              placeholder={messages.placeholders.nationality}
              className="input"
            />
          </Field>

          <Field label={messages.labels.currentStatus}>
            <input
              value={form.currentStatus}
              onChange={(event) => updateField("currentStatus", event.target.value)}
              placeholder={messages.placeholders.currentStatus}
              className="input"
            />
          </Field>

          <Field label={messages.labels.documentCountry}>
            <input
              value={form.documentCountry}
              onChange={(event) => updateField("documentCountry", event.target.value)}
              placeholder={messages.placeholders.documentCountry}
              className="input"
            />
          </Field>

          <Field label={messages.labels.targetAgency}>
            <input
              value={form.targetAgency}
              onChange={(event) => updateField("targetAgency", event.target.value)}
              placeholder={messages.placeholders.targetAgency}
              className="input"
            />
          </Field>

          <Field label={messages.labels.dueDate}>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => updateField("dueDate", event.target.value)}
              className="input"
            />
          </Field>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.wantsCallback}
                onChange={(event) => updateField("wantsCallback", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-trust"
              />
              <span>
                <span className="block font-semibold">{messages.labels.wantsCallback}</span>
                <span className="mt-1 block text-slate-500">{messages.callbackHelp}</span>
              </span>
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                required
                type="checkbox"
                checked={form.consentToPrivacy}
                onChange={(event) => updateField("consentToPrivacy", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-trust"
              />
              <span className="font-semibold">{messages.labels.consentToPrivacy}</span>
            </label>
          </div>
        </div>

        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? messages.buttons.submitting : messages.buttons.submit}
        </button>
      </form>

      <aside className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-lg font-semibold text-ink">{messages.resultTitle}</h3>
        <p className="text-sm leading-6 text-slate-600">{messages.resultDescription}</p>

        {result ? (
          <div className="space-y-4">
            <InfoBlock
              label="Case ID"
              value={result.id}
            />
            <InfoBlock
              label={locale === "ko" ? "분류 결과" : "Category"}
              value={inquiryTypeLabels[result.inquiryType][locale]}
            />
            <InfoBlock
              label={locale === "ko" ? "긴급도" : "Urgency"}
              value={urgencyLabels[result.urgencyLevel][locale]}
            />
            <InfoBlock label={messages.summaryLabel} value={result.generatedSummary} />
            <InfoBlock label={messages.guidanceLabel} value={result.generatedGuidance} preserveLineBreaks />
            <InfoBlock label={messages.completionLabel} value={result.generatedReceiptMessage} />
            <button
              type="button"
              onClick={() => setResult(null)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
            >
              {messages.buttons.newInquiry}
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-slate-500">
            {locale === "ko"
              ? "접수 후에는 자동 분류 결과, 긴급도, 기본 준비서류 안내, 접수 완료 메시지가 이 영역에 표시됩니다."
              : "After submission, this panel will show the category, urgency level, checklist, and receipt message."}
          </div>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  className,
  children
}: PropsWithChildren<{ label: string; className?: string }>) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function InfoBlock({
  label,
  value,
  preserveLineBreaks
}: {
  label: string;
  value: string;
  preserveLineBreaks?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={preserveLineBreaks ? "whitespace-pre-line text-sm leading-6 text-slate-700" : "text-sm leading-6 text-slate-700"}>
        {value}
      </p>
    </div>
  );
}
