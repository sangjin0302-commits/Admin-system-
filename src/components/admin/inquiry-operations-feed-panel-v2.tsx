"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type FeedItem = {
  label: string;
  description: string;
  timestamp: string;
};

export function InquiryOperationsFeedPanelV2({
  items,
  communicationDraft
}: {
  items: FeedItem[];
  communicationDraft: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(communicationDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="ui-section-title">운영 흐름 및 커뮤니케이션 로그</h3>
          <p className="mt-2 text-sm text-text-muted">
            접수 후 어떤 단계까지 진행되었는지와, 지금 바로 고객에게 보낼 수 있는 운영 메모를 함께 보여줍니다.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => void copyDraft()}>
          {copied ? "메모 복사됨" : "운영 메모 복사"}
        </Button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card muted className="p-5">
          <p className="ui-kicker">최근 진행 흐름</p>
          <div className="mt-4 space-y-4">
            {items.map((item, index) => (
              <div key={`${item.label}-${item.timestamp}-${index}`} className="relative pl-6">
                {index < items.length - 1 ? (
                  <span className="absolute left-[7px] top-5 h-[calc(100%+8px)] w-px bg-border/70" />
                ) : null}
                <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border border-border-strong bg-white" />
                <p className="text-sm font-semibold text-text-strong">{item.label}</p>
                <p className="mt-1 text-sm text-text-muted">{item.description}</p>
                <p className="mt-1 text-xs text-text-muted">{item.timestamp}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card muted className="p-5">
          <p className="ui-kicker">운영 메모 초안</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text">{communicationDraft}</p>
        </Card>
      </div>
    </Card>
  );
}
