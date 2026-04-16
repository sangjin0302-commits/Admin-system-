"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ClientMessagePreview } from "@/lib/message-templates/types";

type PreviewMap = {
  ko: ClientMessagePreview;
  en: ClientMessagePreview;
  ar: ClientMessagePreview;
};

export function InquiryMessagePreview({ previews }: { previews: PreviewMap }) {
  const [locale, setLocale] = useState<keyof PreviewMap>("ko");
  const [copyMessage, setCopyMessage] = useState("");
  const preview = previews[locale];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText([preview.subject, "", preview.fullText].join("\n"));
      setCopyMessage(locale === "ko" ? "초안을 복사했습니다." : "Draft copied.");
    } catch {
      setCopyMessage(locale === "ko" ? "복사에 실패했습니다." : "Failed to copy.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-5">
      <div className="flex w-full flex-wrap justify-center gap-2">
        {(["ko", "en", "ar"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={locale === value ? "primary" : "secondary"}
            size="sm"
            onClick={() => setLocale(value)}
          >
            {value === "ko" ? "한국어" : value === "en" ? "English" : "Arabic"}
          </Button>
        ))}
      </div>

      <Card muted className="w-full max-w-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="ui-kicker">메시지 제목</p>
            <p className="mt-2 text-base font-semibold leading-7 text-text-strong sm:text-lg">
              {preview.subject}
            </p>
          </div>
          <Badge>{locale.toUpperCase()}</Badge>
        </div>
      </Card>

      {preview.sections.map((section) => (
        <Card key={section.heading} muted className="w-full max-w-3xl p-6 sm:p-7">
          <p className="ui-kicker">{section.heading}</p>
          <p className="mt-3 whitespace-pre-line text-base leading-7 text-text sm:text-[1.02rem]">
            {section.body}
          </p>
        </Card>
      ))}

      <Card muted className="w-full max-w-3xl p-6 sm:p-7">
        <p className="ui-kicker">전체 미리보기</p>
        <p className="mt-3 whitespace-pre-line text-base leading-7 text-text sm:text-[1.02rem]">
          {preview.fullText}
        </p>
      </Card>

      <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          {locale === "ko" ? "초안 복사" : "Copy Draft"}
        </Button>
        {copyMessage ? <p className="text-xs text-text-muted">{copyMessage}</p> : null}
      </div>
    </div>
  );
}
