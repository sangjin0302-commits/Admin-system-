"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StateInline } from "@/components/ui/state-panel";
import { Textarea } from "@/components/ui/textarea";
import type { PublicIntakeContent } from "@/lib/public-content/defaults";

type Props = {
  initialContent: PublicIntakeContent;
};

type LocaleKey = keyof PublicIntakeContent;

function linesToArray(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function arrayToLines(value: string[]) {
  return value.join("\n");
}

export function PublicIntakeContentForm({ initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const localeSections = useMemo(
    () =>
      [
        { key: "ko" as const, label: "한국어 공개 문구" },
        { key: "en" as const, label: "영문 공개 문구" }
      ] satisfies Array<{ key: LocaleKey; label: string }>,
    []
  );

  function updateField(locale: LocaleKey, field: keyof PublicIntakeContent[LocaleKey], value: string | string[]) {
    setContent((current) => ({
      ...current,
      [locale]: {
        ...current[locale],
        [field]: value
      }
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/public-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content)
      });

      const data = (await response.json()) as { error?: string; content?: PublicIntakeContent };

      if (!response.ok) {
        setError(data.error ?? "공개 접수 문구를 저장하지 못했습니다.");
        return;
      }

      if (data.content) {
        setContent(data.content);
      }

      setSuccess("공개 접수 문구를 저장했습니다.");
    } catch {
      setError("공개 접수 문구를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-2">
          <p className="ui-kicker">Public Intake Content</p>
          <h2 className="ui-page-title mt-1">공개 접수 문구 관리</h2>
          <p className="ui-section-copy mt-2">
            외부 공개 랜딩과 접수 페이지 안내 문구를 관리자 화면에서 바로 수정할 수 있습니다.
            배열 항목은 한 줄에 한 개씩 입력하면 됩니다.
          </p>
        </div>
      </Card>

      {localeSections.map(({ key, label }) => (
        <Card key={key} className="p-6">
          <div className="mb-5">
            <h3 className="ui-section-title">{label}</h3>
          </div>
          <FieldGroup className="sm:grid-cols-2">
            <Field label="랜딩 제목" className="sm:col-span-2">
              <Input
                value={content[key].heroTitle}
                onChange={(event) => updateField(key, "heroTitle", event.target.value)}
              />
            </Field>
            <Field label="랜딩 설명" className="sm:col-span-2">
              <Textarea
                rows={4}
                value={content[key].heroDescription}
                onChange={(event) => updateField(key, "heroDescription", event.target.value)}
              />
            </Field>
            <Field label="주요 전문 분야" className="sm:col-span-2">
              <Textarea
                rows={5}
                value={arrayToLines(content[key].primaryAreas)}
                onChange={(event) => updateField(key, "primaryAreas", linesToArray(event.target.value))}
              />
            </Field>
            <Field label="추가 안내 문구" className="sm:col-span-2">
              <Textarea
                rows={6}
                value={arrayToLines(content[key].additionalGuidance)}
                onChange={(event) =>
                  updateField(key, "additionalGuidance", linesToArray(event.target.value))
                }
              />
            </Field>
            <Field label="접수 페이지 제목" className="sm:col-span-2">
              <Input
                value={content[key].intakePageTitle}
                onChange={(event) => updateField(key, "intakePageTitle", event.target.value)}
              />
            </Field>
            <Field label="접수 페이지 설명" className="sm:col-span-2">
              <Textarea
                rows={4}
                value={content[key].intakePageDescription}
                onChange={(event) =>
                  updateField(key, "intakePageDescription", event.target.value)
                }
              />
            </Field>
            <Field label="접수 안내 제목">
              <Input
                value={content[key].intakeInfoTitle}
                onChange={(event) => updateField(key, "intakeInfoTitle", event.target.value)}
              />
            </Field>
            <Field label="접수 안내 항목" className="sm:col-span-2">
              <Textarea
                rows={6}
                value={arrayToLines(content[key].intakeInfoItems)}
                onChange={(event) => updateField(key, "intakeInfoItems", linesToArray(event.target.value))}
              />
            </Field>
          </FieldGroup>
        </Card>
      ))}

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            {error ? <StateInline tone="error">{error}</StateInline> : null}
            {success ? <StateInline tone="success">{success}</StateInline> : null}
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "저장 중..." : "공개 문구 저장"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
