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
      await navigator.clipboard.writeText(
        [preview.subject, "", preview.fullText].join("\n")
      );
      setCopyMessage(locale === "ko" ? "초안을 복사했습니다." : "Draft copied.");
    } catch {
      setCopyMessage(locale === "ko" ? "복사에 실패했습니다." : "Failed to copy.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
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

      <Card muted className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="ui-kicker">메시지 제목</p>
            <p className="mt-1 text-sm font-semibold text-text-strong">{preview.subject}</p>
          </div>
          <Badge>{locale.toUpperCase()}</Badge>
        </div>
      </Card>

      {preview.sections.map((section) => (
        <Card key={section.heading} muted className="p-5">
          <p className="ui-kicker">{section.heading}</p>
          <p className="mt-2 whitespace-pre-line text-sm text-text">{section.body}</p>
        </Card>
      ))}

      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          {locale === "ko" ? "초안 복사" : "Copy Draft"}
        </Button>
        {copyMessage ? <p className="text-xs text-text-muted">{copyMessage}</p> : null}
      </div>
    </div>
  );
}
