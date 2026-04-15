"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StateInline } from "@/components/ui/state-panel";
import { Textarea } from "@/components/ui/textarea";
import type { OperationsSettings } from "@/lib/operations-content/defaults";

export function OperationsSettingsForm({ initialSettings }: { initialSettings: OperationsSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField<K extends keyof OperationsSettings>(field: K, value: OperationsSettings[K]) {
    setSettings((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/operations-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      const data = (await response.json()) as { error?: string; settings?: OperationsSettings };

      if (!response.ok) {
        setError(data.error ?? "운영 설정을 저장하지 못했습니다.");
        return;
      }

      if (data.settings) {
        setSettings(data.settings);
      }

      setSuccess("운영 설정을 저장했습니다.");
    } catch {
      setError("운영 설정을 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-2">
          <p className="ui-kicker">Operations Settings</p>
          <h2 className="mt-1 ui-page-title">상담 / 결제 운영 설정</h2>
          <p className="ui-section-copy mt-2">
            예약 링크나 결제 링크가 아직 없어도, 관리자에서 유료상담 안내와 계좌이체 안내 문구를 저장해 두고 바로 복사해 사용할 수 있습니다.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">상담 운영 문구</h3>
        <FieldGroup className="mt-5 sm:grid-cols-2">
          <Field label="기본 상담 안내" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={settings.consultationIntro}
              onChange={(event) => updateField("consultationIntro", event.target.value)}
            />
          </Field>
          <Field label="A급 / 우선 상담 안내" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={settings.priorityConsultationGuide}
              onChange={(event) => updateField("priorityConsultationGuide", event.target.value)}
            />
          </Field>
          <Field label="유료 사전진단 안내" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={settings.paidDiagnosisGuide}
              onChange={(event) => updateField("paidDiagnosisGuide", event.target.value)}
            />
          </Field>
          <Field label="서류 검토 우선 안내" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={settings.docsReviewGuide}
              onChange={(event) => updateField("docsReviewGuide", event.target.value)}
            />
          </Field>
          <Field label="불수임 / 외부 연계 안내" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={settings.declineGuide}
              onChange={(event) => updateField("declineGuide", event.target.value)}
            />
          </Field>
          <Field label="상담 링크 라벨">
            <Input
              value={settings.consultationLinkLabel}
              onChange={(event) => updateField("consultationLinkLabel", event.target.value)}
            />
          </Field>
          <Field label="상담 링크 URL">
            <Input
              value={settings.consultationLinkUrl}
              onChange={(event) => updateField("consultationLinkUrl", event.target.value)}
              placeholder="없으면 비워두세요"
            />
          </Field>
        </FieldGroup>
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">계약 / 결제 운영 문구</h3>
        <FieldGroup className="mt-5 sm:grid-cols-2">
          <Field label="계약 진행 안내" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={settings.contractGuide}
              onChange={(event) => updateField("contractGuide", event.target.value)}
            />
          </Field>
          <Field label="결제 기본 안내" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={settings.paymentGuide}
              onChange={(event) => updateField("paymentGuide", event.target.value)}
            />
          </Field>
          <Field label="결제 방식 라벨">
            <Input
              value={settings.paymentMethodLabel}
              onChange={(event) => updateField("paymentMethodLabel", event.target.value)}
            />
          </Field>
          <Field label="결제 링크 URL">
            <Input
              value={settings.paymentLinkUrl}
              onChange={(event) => updateField("paymentLinkUrl", event.target.value)}
              placeholder="없으면 비워두세요"
            />
          </Field>
          <Field label="계좌이체 / 수기 결제 안내" className="sm:col-span-2">
            <Textarea
              rows={5}
              value={settings.bankTransferGuide}
              onChange={(event) => updateField("bankTransferGuide", event.target.value)}
            />
          </Field>
          <Field label="내부 운영 메모" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={settings.internalRoutingNote}
              onChange={(event) => updateField("internalRoutingNote", event.target.value)}
            />
          </Field>
        </FieldGroup>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            {error ? <StateInline tone="error">{error}</StateInline> : null}
            {success ? <StateInline tone="success">{success}</StateInline> : null}
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "저장 중..." : "운영 설정 저장"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
